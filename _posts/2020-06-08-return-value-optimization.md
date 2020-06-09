---
pid: 6
title: "Return value optimization"
date: 2020-06-08
authors: smurthys
cpp_level: intermediate
cpp_version: "C++03"
reader_activity: exercise
---

Return-value optimization (RVO) is a compiler technique to return an object value from a
function without creating a temporary object. RVO permits us to avoid reference
parameters or pointer return values just to avoid copying objects. It also simplifies
function design and reduces scope for errors. However, there are situations where a
compiler may be unable to perform RVO, and there are programming patterns where it may be
better or acceptable to forego RVO.
<!--more-->

RVO is a relatively old technique and has been permitted since [C++98](http://www.lirmm.fr/~ducour/Doc-objets/ISO+IEC+14882-1998.pdf)
(see Section 12.2). C++ compilers have likely supported RVO as far back as 2001, but I am
able to trace it back only to [Visual C++ 2005](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80))
and [GCC 4.1.2](https://godbolt.org/z/bPNMaw) (which was released in [2007](https://gcc.gnu.org/releases.html)).

**Note:** All examples and optimizations described in this post were verified in GCC 10.1
and Visual Studio 2019 Version 16.5.5 ([MSVC++ 14.25, _MSC_VER 1925](https://en.wikipedia.org/wiki/Microsoft_Visual_C%2B%2B#Internal_version_numbering)).

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; RVO illustration

Listing A shows a simple struct that is rigged to show which constructor is called as
well as to show when the assignment operator and the destructor are called. The static
variable `counter` is used to assign unique identifiers to instances of the struct.

---
{% include bookmark.html id="Listing A" %}

##### Listing A: a struct rigged to show constructor, assignment, and destructor calls

```cpp
static int counter; // counter to identify instances of S

struct S {
    int i{ 0 };
    int id;

    S() : id(++counter) {
        std::cout << "default ctor " << id << "\n";
    }

    S(const S& s) : i(s.i), id(++counter) {
        std::cout << "copy ctor " << id << "\n";
    }

    S& operator=(const S& s) {
        i = s.i;
        std::cout << "assign " << s.id << " to " << id << "\n";
        return *this;
    }

    ~S() {
        std::cout << "dtor " << id << "\n";
    }
};

S get_A() {
    return S(); // 1. default ctor 1
}

int main() {
    S s = get_A();
} // 2. dtor 1

```

Without RVO, the combination of `get_A` and `main` in Listing A would create two instances
of struct S: one instance on the `return` statement in `get_A` and another in the
initialization of variable `s` in `main`. However only one instance is created with RVO.
The comments in code show the location and sequence of construction and destruction.

**Note:** RVO is concerned with objects created on the `return` statement. Both GCC and
MSVC perform RVO by default.

---

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Named RVO

Named RVO (NRVO) is concerned with optimization performed on "named objects" that are
not created on a `return` statement. Listing B shows some code to return a named instance
of struct `S` without NRVO and with NRVO: Without NRVO, two instances of `S` are created
and destroyed; with NRVO, only one object is created and destroyed. The comments in code
show the location and sequence of object creation and destruction in each case.

**Note:** GCC performs NRVO by default, whereas [MSVC requires `/O2` optimization for NRVO](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)#optimization-side-effects).

---
{% include bookmark.html id="Listing B" %}

##### Listing B: return object value without NRVO and with NRVO ([run this code](https://godbolt.org/z/9Vpx_R))

<div class="row">
<div class="column-2" markdown="1">
<div class="column-head">Without NRVO</div>

```cpp
S get_B() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s; // 2. copy ctor 2
} // 3. dtor 1

int main() {
    S s = get_B();
} // 4. dtor 2
```

</div>
<div class="column-2" markdown="1">
<div class="column-head">With NRVO</div>

```cpp
S get_B() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s;
}

int main() {
    S s = get_B();
} // 2. dtor 1
```

</div>
</div>
---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; NRVO limitations

At present, compilers perform NRVO only if the same named object is returned from all
paths of a function. They do not perform NRVO if different paths return different named
objects. Listing C illustrates this issue: Function `get_C1` has two different paths, but
it returns the same named object in both parts. Thus, the compiler is able to perform
NRVO. Function `get_C2` also has two return paths, but each path creates and returns a
different named object. In this case, the compiler does not perform NRVO.

**Note:** MSVC does **not** perform NRVO even for function `get_C1`. It creates two
instances of `S` in that function.

---
{% include bookmark.html id="Listing C" %}

##### Listing B: returning same and different named objects ([run this code](https://godbolt.org/z/QmqW6N))

```cpp
S get_C1(int x) {
    S s;                // 1. default ctor 1
    if (x % 2 == 0) {
        s.i = 8;
        return s;
    } else {
        s.i = 22;
        return s;
    }
}

S get_C2(int x) {
    if (x % 2 == 0) {
        S s1;          // 2. default ctor 2
        s1.i = 8;
        return s1;     // 3. copy ctor 3 (either this or s2 below)
    } else {
        S s2;
        s2.i = 22;
        return s2;     // 3. copy ctor 3 (either this or s1 above)
    }
} // 4. dtor 2

int main() {
    std::cout << "get_C1:\n";
    S s1 = get_C1(3);

    std::cout << "\nget_C2:\n";
    S s2 = get_C2(3);
} // 5. dtor 3, dtor 1

```

---

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Working around lack of RVO

The struct `S` of Listing A is a good instrument to test if a compiler performs RVO
(includes NRVO in the remainder of this post) in a given situation. In a situation
where the optimization is not performed, a simple solution is to pass to the called
function a reference to an instance and have the function modify the referenced object.
This approach assumes the object supports all necessary modifier functions. It also makes
the function interface a bit more complex.

An alternative is for the called function to dynamically allocate an object and always
return an object pointer, but this approach can be error prone and lead to memory leaks
if the object is not freed.

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Missed optimization

Listing D shows a subtle programming error that causes loss of RVO. In `main`, an
instance of S is created using the default constructor in the first line and is then
assigned the return value from function `get_D`. This situation requires the compiler
to invoke the assignment operator to set variable `s` to the function's return value.

---
{% include bookmark.html id="Listing D" %}

##### Listing D: missed RVO ([run this code](https://godbolt.org/z/ojrcdp))

```cpp
S get_D() {
    S s;                // 2. default ctor 2
    s.i = 8;
    return s;
}

int main() {
    S s;                // 1. default ctor 1
    s = get_D();        // 3. assign 2 to 1; 4. dtor 2
} // 5. dtor 1
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Foregoing optimization

In some situations it can be acceptable or better to forego RVO. For example, if a
function returns a small object (such as instances of the example struct `S`) it may be
acceptable to lose the benefit of the optimization. However, if a function returns a
large object such as a vector of 100 string objects, it might be important to take
advantage of the optimization.

It is not possible to take advantage of RVO if the object returned from a function has
block scope and that object needs to be used in a later block. In this case, the variable
must be declared in an outer block and thus RVO is missed. Alternatives such as those
outlined in [Section 4](#4) would need to be used if it is necessary to benefit from RVO.

Listing E shows an example situation where it is not possible to benefit from RVO.
Functions `get_E` and `use_E` are some functions that return and accept an instance of S,
respectively. (The code is a simplified version of a real-life code.) The code in the
"Lose RVO" scenario misses out on RVO, but it is simple and readable. In contrast, the
code in the "Gain RVO" scenario benefits from RVO, but it is apparently less readable.

**Note:** Listing E is meant only to illustrate common trade-offs involving RVO. It is not
meant to promote any particular programming pattern. Other (better) approaches can exist,
and the approach chosen depends on application needs.

---
{% include bookmark.html id="Listing E" %}

##### Listing E: losing or gaining RVO ([run this code](https://godbolt.org/z/Sqy4Zh))

<div class="row">
<div class="column-2" markdown="1">
<div class="column-head">Lose RVO</div>

```cpp
int main() {
    S s;                // default ctor
    try {
        s = get_E();    // missed RVO
        use_E(s);
    } catch (...) {
        std::cout << "error getting/using s";
        return 1;
    }

    try {
        // do stuff, maybe unrelated to s
    } catch (...) {
        std::cout << "error doing stuff";
        return 2;
    }

    if (s.i == 3) // use s again
        std::cout << "It was 3 all along";
}
```

</div>
<div class="column-2" markdown="1">
<div class="column-head">Gain RVO</div>

```cpp
int main() {
    try {
        S s = get_E();    // RVO
        use_E(s);

        try {
            // do stuff, maybe unrelated to s
        } catch (...) {
            std::cout << "error doing stuff";
            return 2;
        }

        if (s.i == 3) // use s again
            std::cout << "It was 3 all along";

    } catch (...) {
        std::cout << "error getting/using s";
        return 1;
    }
}
```

</div>
</div>

---

{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Summary

Summarize RVO and NRVO. Summarize compiler limitations.

The struct `S` of Listing A is a good instrument to test if a compiler performs RVO
in a given situation.

{% include bookmark.html id="8" %}

### 8.&nbsp;&nbsp; Exercise

Run all the examples in this post in MSVC. In all cases, run the code with
optimization disabled (`/Od`) and again with optimization for speed (`/O2`). Analyze the
result from each run and compare the results across runs. For ease of use, set the active
configuration to "Release" in all runs.

**Note:** [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/)
is free to use. (This is not product promotion.)
