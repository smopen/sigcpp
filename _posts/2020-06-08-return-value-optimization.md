---
pid: 6
title: "Return value optimization"
date: 2020-06-08
authors: smurthys
cpp_level: intermediate
cpp_version: "C++03"
reader_activity: exercises
---

Return-value optimization (RVO) is a compiler technique to avoid copying an object that
a function returns as its value, including avoiding creation of a temporary object. This
optimization permits a function to efficiently return large objects while also
simplifying the function's interface and eliminating scope for issues such as resource
leaks (depending on the approach used to avoid object copying). However, there are
situations where a compiler may be unable to perform RVO, and there are situations where
it may be acceptable or even better to forego RVO.
<!--more-->

RVO and Named RVO (NRVO) are part of a broader category of optimizations under the "copy
elision" umbrella [[class.copy.elision]](https://timsong-cpp.github.io/cppwp/n4659/class.copy.elision). C++17 requires copy elision in some circumstances, but it does not require
RVO or NRVO (rather it permits them). Because RVO and NRVO are not guaranteed, it is
important to verify that the compiler indeed performs those optimizations in a given
circumstance.

RVO is a relatively old technique and has been permitted since [C++98](http://www.lirmm.fr/~ducour/Doc-objets/ISO+IEC+14882-1998.pdf)
(see Section 12.2). C++ compilers have likely supported RVO as far back as 2001, but I am
able to trace it back only to [Visual C++ 2005](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80))
and GCC 4.1.2 (which was released in [2007](https://gcc.gnu.org/releases.html)).

**Note:** All examples and optimizations described in this post are verified in C++17
using both GCC 10.1 and Visual Studio 2019 Version 16.5.5 ([MSVC++ 14.25, _MSC_VER 1925](https://en.wikipedia.org/wiki/Microsoft_Visual_C%2B%2B#Internal_version_numbering)).
The code in Listings A, B, and C are also verified in C++98 using [GCC 4.1.2](https://godbolt.org/z/U_LjWR).

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; RVO illustration

Listing A shows a simple struct rigged to show which constructor is called as well as to
show when the assignment operator and the destructor are called. The static variable
`counter` is used to assign unique identifiers to instances of the struct. The rest of
this post uses this rig to illustrate RVO and NRVO as well as to check the circumstances
in which a compiler performs those optimizations.

---
{% include bookmark.html id="Listing A" %}

##### Listing A: a struct rigged to show constructor, assignment, and destructor calls

```cpp
static int counter; // counter to identify instances of S

struct S {
    int i{ 0 };
    int id;

    S() : id{ ++counter } {
        std::cout << "default ctor " << id << "\n";
    }

    S(const S& s) : i{ s.i }, id{ ++counter } {
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
```

Listing B shows some code to return a temporary object in two different scenarios:
without RVO and with RVO. In both cases, the object value to return is unnamed and is
created in the `return` statement. The comments in code call out the location and
sequence of object creation and destruction.

When compiled with no RVO, the code creates two objects: a temporary object in function
`get_B` using the default constructor, and the object named `s` in `main` using the copy
constructor. However, when the same code is compiled with RVO, only one object is
created.

**Note:** RVO is concerned only with objects created on the `return` statement. Both GCC
and MSVC perform RVO by default.

---
{% include bookmark.html id="Listing B" %}

##### Listing B: behavior without RVO and with RVO ([run this code](https://godbolt.org/z/9Vpx_R))

<div class="row">
<div class="column-2" markdown="1">
<div class="column-head">Without RVO</div>

```cpp
S get_B() {
    return S(); // 1. default ctor 1
} // 2. copy ctor 2; 3. dtor 1

int main() {
    S s = get_B();
} // 4. dtor 2
```

</div>
<div class="column-2" markdown="1">
<div class="column-head">With RVO</div>

```cpp
S get_B() {
    return S(); // 1. default ctor 1
}

int main() {
    S s = get_B();
} // 2. dtor 1
```

</div>
</div>
---

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Named RVO

Named RVO (NRVO) is concerned with optimization performed on "named objects", which are
objects not created on a `return` statement. Listing C shows some code to return a named
object without NRVO and with NRVO: Without NRVO, two instances of `S` are created and
destroyed, whereas with NRVO, only one object is created and destroyed. The comments in
code show the location and sequence of object creation and destruction in each case.

**Note:** GCC performs NRVO by default, which can be disabled; MSVC disables NRVO by
default, but it can be enabled using [`/O2` optimization](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)#optimization-side-effects).

---
{% include bookmark.html id="Listing C" %}

##### Listing C: behavior without NRVO and with NRVO ([run this code](https://godbolt.org/z/9Vpx_R))

<div class="row">
<div class="column-2" markdown="1">
<div class="column-head">Without NRVO</div>

```cpp
S get_C() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s; // 2. copy ctor 2
} // 3. dtor 1

int main() {
    S s = get_C();
} // 4. dtor 2
```

</div>
<div class="column-2" markdown="1">
<div class="column-head">With NRVO</div>

```cpp
S get_C() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s;
}

int main() {
    S s = get_C();
} // 2. dtor 1
```

</div>
</div>
---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Compiler limitations

Presently, compilers perform NRVO only if the same named object is returned from all
paths of a function. They do **not** perform NRVO if different paths return different
named objects. Listing D sets up the both scenarios: Function `get_D1` has two different
paths and both paths return the same named object. Function `get_D2` also has two return
paths, but each path creates and returns a different named object.

**Note:** GCC performs NRVO in `get_D1`, but not in `get_D2`. MSVC does **not** perform
NRVO even in function `get_D1` (even with `/O2` enabled).

---
{% include bookmark.html id="Listing D" %}

##### Listing D: returning named objects in different paths ([run this code](https://godbolt.org/z/QmqW6N))

```cpp
S get_D1(int x) {
    S s;                // 1. default ctor 1
    if (x % 2 == 0) {
        s.i = 8;
        return s;
    } else {
        s.i = 22;
        return s;
    }
}

S get_D2(int x) {
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
    std::cout << "get_D1:\n";
    S s1 = get_D1(3);

    std::cout << "\nget_D2:\n";
    S s2 = get_D2(3);
} // 5. dtor 3, dtor 1
```

---

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Working around lack of RVO

In a situation where the compiler does not perform RVO (includes NRVO for the remainder
of this post), a simple solution is to pass to the called function a reference to an
instance and have the function modify the referenced object. This approach assumes the
object supports all necessary modifier functions. It also makes the function interface a
bit more complex.

An alternative is for the called function to dynamically allocate an object and always
return an object pointer, but this approach is error prone (all the issues related to
pointer manipulation) and causes memory leaks if the object is not freed.

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Missed optimization

Listing E shows a subtle programming error that causes loss of RVO. In `main`, an
instance of `S` is created using the default constructor in the first line and is then
assigned the return value from function `get_E`. This situation requires the compiler
to create two objects and invoke the assignment operator to set variable `s` to the
function's return value.

---
{% include bookmark.html id="Listing E" %}

##### Listing E: missed RVO ([run this code](https://godbolt.org/z/ojrcdp))

```cpp
S get_E() {
    S s;                // 2. default ctor 2
    s.i = 8;
    return s;
}

int main() {
    S s;                // 1. default ctor 1
    s = get_E();        // 3. assign 2 to 1; 4. dtor 2
} // 5. dtor 1
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Foregoing optimization

In some situations it can be acceptable or even better to forego RVO. For example, if a
function returns a small object (such as instances of the example struct `S`) it may be
acceptable to lose the benefit of the optimization. However, if a function returns a
large object such as a vector of 100 string objects, it might be important to take
advantage of the optimization.

It is not possible to take advantage of RVO if the object returned from a function has
block scope and that object needs to be used in a later block. In this case, the variable
must be declared in an outer block and thus RVO is missed. Alternatives such as those
outlined in [Section 4](#4) would need to be used if it is necessary to benefit from RVO.

Listing F shows an example situation where it is not possible to benefit from RVO.
Functions `get` and `use` are some functions that return and accept an instance of `S`,
respectively. (The code shown is actually a simplified version of real-life code.) The
code in the "Lose RVO" scenario misses out on RVO, but it is simple and readable largely
because the exception handlers are sequential. In contrast, the code in the "Gain RVO"
scenario benefits from RVO, but it is obviously less readable, largely due to the nested
exception handling.

**Note:** Listing F is meant only to illustrate common trade-offs involving RVO. It is
not meant to promote any particular programming pattern. Other (better) approaches can
exist, and the approaches available as well as the best approach depend on the
application.

---
{% include bookmark.html id="Listing F" %}

##### Listing F: losing or gaining RVO ([run this code](https://godbolt.org/z/Sqy4Zh))

<div class="row">
<div class="column-2" markdown="1">
<div class="column-head">Lose RVO, sequential exception handling</div>

```cpp
int main() {
    S s;             // default ctor
    try {
        s = get(); // missed RVO
        use(s);
    } catch (...) {
        std::cout << "error get/use";
        return 1;
    }

    try {
        // stuff, unrelated to s
    } catch (...) {
        std::cout << "error";
        return 2;
    }

    if (s.i == 3) // use s again
        std::cout << "It was 3?";
}
```

</div>
<div class="column-2" markdown="1">
<div class="column-head">Gain RVO, nested exception handling</div>

```cpp
int main() {
    try {
        S s = get(); // RVO
        use(s);

        try {
            // stuff, unrelated to s
        } catch (...) {
            std::cout << "error";
            return 2;
        }

        if (s.i == 3) // use s again
            std::cout << "It was 3?";

    } catch (...) {
        std::cout << "error get/use";
        return 1;
    }
}
```

</div>
</div>

---

{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Summary

RVO (including NRVO) is a compiler technique to avoid copying an object that
a function returns as its value. This optimization helps function to efficiently return
large objects while also simplifying the function's interface and eliminating scope for
errors. However, ISO C++ does not require RVO, and support for RVO varies across
compilers and by situation. Thus it is necessary to verify if the compiler performs RVO
in a given situation and rewrite code to benefit from RVO, forego RVO, or work around
lack of RVO.

The struct `S` in Listing A is a good instrument to test if a compiler performs RVO and
NRVO in a given situation.

{% include bookmark.html id="8" %}

### 8.&nbsp;&nbsp; Exercises

1. Study [this program](https://godbolt.org/z/r7sowD) prepared to verify copy elision in
   C++98 using GCC 4.6.4:

    1. As is, which kind of optimization does the code perform: RVO or NRVO? What is the
       location and sequence of object construction and destruction?

    2. Change function `get` such that it performs a different kind of optimization than
       what is given: change the code to perform RVO if it performs NRVO as is, and
       vice versa.

    3. Disable copy elision and compare the result with the result from when elision is
       enabled. Explain the reason for the differences between the results. You can
       disable copy elision by including the option `-fno-elide-constructors` in the pane
       containing execution results. (Copy elision is enabled by default.)

    4. In what ways does the C++98 code provided differ from the corresponding C++17
       code? This question has nothing to with RVO or NRVO, but is opportunistically
       included to highlight some syntactic differences between C++98 and C++17.

2. Run all the code examples in this post in MSVC. Run the code with optimization
   disabled (`/Od`, which is the default) and again with optimization for speed (`/O2`) enabled. Analyze the result from each run and compare the results across runs. For ease of use, set the active configuration to "Release" in all runs.

   **Note:** [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/)
   is free, just in case you do not already have MSVC installed.
