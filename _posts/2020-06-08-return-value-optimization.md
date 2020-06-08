---
pid: 6
title: "Return value optimization"
date: 2020-04-20
authors: smurthys
cpp_level: intermediate
cpp_version: "C++03"
---

Return-value optimization (RVO) is a compiler technique to return an object value from a
function without incurring the penalty of creating a temporary object. RVO permits us to
avoid reference parameters or pointer return values just to avoid copying objects. It
also simplifies function design and reduces scope for errors. However, there are
situations where a compiler may be unable to perform RVO, and there are programming
patterns where it may be better to forego RVO.
<!--more-->

RVO is a relatively old technique and has been permitted since [C++98](http://www.lirmm.fr/~ducour/Doc-objets/ISO+IEC+14882-1998.pdf)
(see Section 12.2). C++ compilers have likely supported RVO as far back as 2001, but I am
able to trace it back only to [Visual C++ 2005](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80))
and [GCC 4.1.2](https://godbolt.org/z/bPNMaw) (which was released in [2007](https://gcc.gnu.org/releases.html)).

**Note:** GCC performs RVO by default, whereas [MSVC requires /O2 optimization for RVO](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)#optimization-side-effects).

### Scope for RVO

Listing A shows a simple struct that is rigged to show which constructor is called as
well as to show when the destructor is called. The global variable counter is used to
assign unique identifiers to instances of the struct.

---
{% include bookmark.html id="Listing A" %}
##### Listing A: a struct rigged to show constructor and destructor calls

```cpp
int counter; // counter to identify instances of S

struct S {
    int i;
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
```

---

Listing B compares some code to instantiate struct S without RVO and with RVO. The code
is the same in both scenarios, but the result is different as shown in the comments and
the output text.

Without RVO, the code

---

##### Listing B: comparing object value return without RVO and with RVO


<div class="row">
<div class="col-md-6" markdown="1">

```cpp
S get() {
    S s;      // default ctor 1
    s.i = 5;
    return s; // copy ctor 2
}             // dtor 1  

int main() {
    S s = get();
}             // dtor 2
```

</div>
<div class="col-md-6" markdown="1">

```cpp
S get() {
    S s;      // defaulr ctor 1
    s.i = 5;
    return s;
}

int main() {
    S s = get();
}             // dtor 1
```
</div>
</div>


<div style="-webkit-column-count: 2; -moz-column-count: 2; column-count: 2; -webkit-column-rule: 1px dotted #e0e0e0; -moz-column-rule: 1px dotted #e0e0e0; column-rule: 1px dotted #e0e0e0;">
<div style="display: inline-block;">
<strong>Without RVO</strong>
<pre><code class="language-cpp">S get() {
    S s;      // default ctor 1
    s.i = 5;
    return s; // copy ctor 2
}             // dtor 1  
<p>
int main() {
    S s = get();
}             // dtor 2
</code></pre>
</div>

<div style="display: inline-block;">
<strong>With RVO</strong>
<pre><code class="language-cpp">S get() {
    S s;      // defaulr ctor 1
    s.i = 5;
    return s;
}
<p>
int main() {
    S s = get();
}             // dtor 1
</code></pre>
</div>
</div>


---

Compiler Explorer: 
1. with in-out param: https://godbolt.org/z/TRRKWk
2. with RVO: https://godbolt.org/z/7zAn88
3. with RVO but not taking advantage: https://godbolt.org/z/HdAvgn

### References

Distinguish between RVO and NRVO: https://www.fluentcpp.com/2016/11/28/return-value-optimizations/

Wikipedia: https://en.wikipedia.org/wiki/Copy_elision
