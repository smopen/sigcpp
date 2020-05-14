---
title: "Efficiently processing immutable text"
date: 2020-04-03
authors: smurthys
---

Introduced in C++17, the STL class `std::string_view` provides more efficient ways than
`std::string` to process immutable (read only) text data. `std::string_view` also
provides a safer means to perform read-only operations on [C-strings](/2020/03/30/exploring-c-strings)
and character arrays. Overall, using `std::string_view` for read-only operations on text
data can improve execution speed as well as reduce both main-memory usage and executable
size.

This is Part 1 of a 2-part series on `std::string_view`. This part focuses on efficiency
of `std::string_view` over `std::string`. Part 2 focuses on safety and provides some
guidelines on when to use `std::string_view`.
<!--more-->

### Creating string_view objects

A string_view is just a read-only wrapper around a character array ("a constant
contiguous sequence of `char`-like objects" to be precise [[string.view](https://timsong-cpp.github.io/cppwp/n4659/string.view)]).

A string_view object can be created using one of its [five constructors](https://en.cppreference.com/w/cpp/string/basic_string_view/basic_string_view):

1. Default constructor: represents an empty string
2. Copy constructor
3. Custom constructor which accepts a character array and a size
4. Custom constructor which accepts a C-string
5. Custom constructor which accepts a range of characters as iterators

A string_view object can also be constructed using (or be assigned from) a `std::string`
object because `std::string` defines an operator to return a string_view version of a
string object. For example, the following creation operations are permitted:

```cpp
std::string s;
std::string_view sv1(s);
std::string_view sv2 = s;
```

### Creation efficiency

For starters, compare the effect of creating an object to work with the text `hello`
using `std::string` and `std::string_view`. A comparison of the [code generated](https://godbolt.org/z/2tEvxC)
shows the following differences:

1. `std::string s1("hello");`
   - 316 instructions: 32 in `main`
   - Calls to constructors of `std::allocator` and `std::basic_string`
   - Calls to destructors  of `std::allocator` and `std::basic_string`
   - Several calls to constructors, destructors, and other functions in supporting classes

2. `std::string_view s1("hello");`  
   - 95 instructions: 10 in `main`
   - Call to constructor of `std::basic_string_view`
   - Just two calls to supporting functions

Because higher number of instructions does not necessarily mean poor code, and because it
is possible `std::string` has greater fixed overhead, it is instructive to study the code
when [two object declarations](https://godbolt.org/z/vjLVGt) are made: The `std::string`
approach ("the string approach" going forward) has 24 additional instructions in `main`,
whereas the `std::string_view` approach ("the string_view approach" going forward) has
four additional instructions in `main`. Thus, simplistically speaking, we could say that
each declaration of string object adds about 24 instructions, whereas each declaration of
a string_view object adds only about four instructions. (Revise the code to declare three
objects in each approach and see if the growth numbers hold.)

However, the more salient observation is that the string approach results in multiple
calls to elaborate functions which can reduce execution speed. For example, Listing A
shows a program to measure the elapsed wall time to create 500,000 empty objects using
both the string and string_view approaches. The exact elapsed time can vary across runs,
but the results from this program consistently show that the string approach is an order
of magnitude slower than the string_view approach (for example, 5 msecs Vs 0.7 msecs).

---

##### Listing A: measure time to create string and string_view objects ([run this code](https://godbolt.org/z/SFRVNo))

```cpp
#include <iostream>
#include <string>
#include <string_view>
#include <chrono>

int main() {
    //construct many std::string instances
    auto start = std::chrono::steady_clock::now();
    for (int i = 0; i < 500000; ++i)
        std::string s;

    auto end = std::chrono::steady_clock::now();
    std::chrono::duration<double> elapsed = end-start;
    std::cout << "string: " << elapsed.count() << "s\n";

    //construct many std::string_view instances
    start = std::chrono::steady_clock::now();
    for (int i = 0; i < 500000; ++i)
        std::string_view sv;

    end = std::chrono::steady_clock::now();
    elapsed = end-start;
    std::cout << "string_view: " << elapsed.count() << "s\n";
}
```

---

**Note:** It can be instructive to change Listing A to pass an empty C-string literal to
the constructor in each approach. For example, in the string approach, use
`std::string s{""}` instead of `std::string s;`. This simple change should significantly
increase the elapsed time for both approaches, meaning we should use the default
constructor when representing empty text.

Likewise, it can also be instructive to study the results after revising Listing A to use
the copy constructor in each approach. For this study, add the following lines to the
beginning of function `main`. Then change the constructor call in each loop to use the
copy constructor, passing `cs` or `csv` to the constructor (based on the approach). For
example, change `std::string s;` to `std::string s(cs);`.

```cpp
const std::string cs{"pack my box with five dozen liquor jugs"};
const std::string_view csv{"pack my box with five dozen liquor jugs"};
```

### Processing efficiency

Generally speaking, `std::string_view` supports only the sub-set of the functionality of
`std::string` that pertains to reading array elements, obtaining read-only iterators,
learning array size, extracting a read-only sub-string, comparing, and finding. Only
three members functions are modifiers (discussed soon). In addition to these functions,
the `<string_view>` header includes functions to perform relational operations on
string_view objects and a function to insert a string_view to an output stream.

In short, `std::string_view` is designed to be a drop-in replacement for `std::string` as
far as read-only operations are concerned. However, some of the string_view operations
are more efficient than their string counterparts. For example the function `substr` to
return a substring is much more efficient because its return value is a new string_view
object which we have already established is faster to create than creating a new string
object.

Listing B shows a program to extract space-delimited words from some text. It is written
using `std::string_view`, but the program works if the type name `std::string_view` is
replaced with `std::string_view` throughout the program, and the `<string>` header is
included instead of `<string_view>` header.

If the word-extraction in Listing B is performed a large number of times
([simple version](https://godbolt.org/z/A6zDw_), [templatized version](https://godbolt.org/z/jbYe2B))
using both string and string_view approaches, it becomes apparent that the string
approach is slower (1.25-3 times) than the string_view approach.

(The linked code causes two compiler warnings that are not addressed for simplicity. I
highly recommend reading Jonathan Boccara's post on
[disabling compiler warnings](https://www.fluentcpp.com/2019/08/30/how-to-disable-a-warning-in-cpp/).)

---

##### Listing B: extract space-delimited words ([run this code](https://godbolt.org/z/G-EbgE))

```cpp
#include <iostream>
#include <string_view>

int main() {
    std::string_view sv{"pack my box with five dozen liquor jugs"};

    std::string_view::size_type pos{sv.find(' ')}, lastPos = 0;
    while(pos != std::string_view::npos) {
        std::cout << sv.substr(lastPos, pos-lastPos) << '\n';
        lastPos = pos+1;
        pos = sv.find(' ', lastPos);
    }

    std::cout << sv.substr(lastPos, pos-lastPos) << '\n';
}
```

---

### Modification efficiency

Contrary to what their name suggests, the modifier functions of string_view do not alter
the character array wrapped. Instead, they alter two internal data members used to
provide the entire string_view functionality. The two internal data members are:

- `data_`: a pointer to the first character of the array wrapped
- `size_`: the number of characters of interest in the array

(In contrast, the modifier functions of string actually alter data.)

The modifier functions `remove_prefix` and `remove_suffix` have the effect of reducing
the part of the array on which the string_view can operate. Function `remove_prefix`
advances the data pointer by a specified number of positions and reduces size by the same
amount, whereas `remove_suffix` leaves the data pointer unchanged and reduces size by a
specified number. This simple approach provides string_view considerable efficiency over
the function `erase` defined for string objects.

**Note:** It is **not** possible to restore the range of the array once it is reduced
using either `remove_prefix` or `remove_suffix`.  

Listing C shows a program to extract space-delimited words from a string_view using
function `remove_prefix`. A comparison with Listing B shows that Listing C is a bit more
easier to read and maintain. However, a [comparison of the approaches in Listings B and C](https://godbolt.org/z/GzkhvA)
shows that Listing B's approach is *marginally* faster (about 2%). This behavior is
expected because `remove_prefix` in Listing C does more work than Listing B does in
changing the value of variable `lastPos`. Yet, with the difference in execution speed
being relatively small, in some cases, one might prefer using the Listing C approach due
to its improved readability and maintainability.

---

##### Listing C: extract space-delimited words through modification ([run this code](https://godbolt.org/z/68raty))

```cpp
#include <iostream>
#include <string_view>

int main() {
    std::string_view sv{"pack my box with five dozen liquor jugs"};

    std::string_view::size_type pos{sv.find(' ')};
    while(pos != std::string_view::npos) {
        std::cout << sv.substr(0, pos) << '\n';
        sv.remove_prefix(pos+1);
        pos = sv.find(' ');
    }

    std::cout << sv << '\n';
}
```

---

Using strings, word extraction by modification is similar to what is shown in Listing C
except the call to `remove_prefix` needs to be replaced with a call to function [`erase`](https://en.cppreference.com/w/cpp/string/basic_string/erase).

A [comparison](https://godbolt.org/z/gjqer2) of word-extraction through modification in
the string and string_view approaches shows the string approach is slower (1.2-2.5 times).

### Summary

Overall, `std::string_view` provides more efficient ways to process immutable data than
`std::string` does. This efficiency is seen in object creation, general processing, and
"modification".

Whereas this part of the 2-part series on string_view focuses on efficiency, Part 2
focuses on safety and offers some guidelines on when to use string_view.
