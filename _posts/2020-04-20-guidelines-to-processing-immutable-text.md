---
id: 5
title: "Guidelines to processing immutable text"
date: 2020-04-20
authors: smurthys
cpp_level: intermediate
cpp_version: "C++17"
---

This post concludes the 3-part series on `std::string_view`: [Part 1](/2020/04/03/efficiently-processing-immutable-text)
focuses on the efficiency aspects, [Part 2](/2020/04/07/safely-processing-immutable-text)
focuses on the safety aspects, and Part 3 (this post) provides some guidelines on using
`std::string_view`.
<!--more-->

{% include bookmark.html id="1" %}
### General guidelines

Overall, there are three ways to model immutable text: `char` arrays (including
C-strings), `std::string` ("string"), and `std::string_view`.

1. **Prefer string_view over character arrays** even though character arrays are
   "lighter" (string_view maintains both a pointer and a size for each array)
   because the memory reduction with an array is small compared to the safety
   string_view provides. Also, working directly with an array often requires carrying
   array size in an additional variable (or requires computing size in case of C-strings).

2. **Prefer string_view over string** if many objects are created either directly using
   a constructor or due to sub-string extraction using the `substr` function.

3. **`const` qualify immutable data** even if it is modeled as an array or a string. In a
   situation where text data is mutable and a part of the code performs immutable
   operations, refactor the part with immutable operations into a separate function and
   receive `const` parameters in the new function.

4. **Model compile-time constants as string_view** instead of character arrays or string
   objects.

5. **Mark compile-time constants `constexpr`** if the increased compilation time is
   acceptable. (Excessive use of `constexpr` could significantly increase compile time
   for large programs.)

```cpp
const char z1[]{"hello"};      // "lighter" than string_view but less safe
const std::string s1{"hello"}; // heavier and slower than string_view
std::string_view sv1{"hello"}; // preferred; see note on const qualification

constexpr char z2[]{"hello"};
constexpr std::string s2{"hello"};  // since C++20
constexpr std::string_view sv2{"hello"};
```

**Note:** Data in a string_view is immutable even if the string_view is not `const`
qualified. `const` qualification only prevents the use of [modifier functions]( {{ '/2020/04/03/efficiently-processing-immutable-text#modification-efficiency' | relative_url }} )
`remove_prefix`, `remove_suffix`, and `swap`.

### Run-time data

Text that is read at run time can only be modeled as `char` array or a string object and a
string_view object needs to be created from the array or string.

```cpp
char z3[10];
std::cin >> z3;             // safe only if fewer than 10 chars are read
std::string_view sv3_1{z3}; // sv3_1 provides read-only access to z3

std::string s3;
std::cin >> s3;
std::string_view sv3_2{s3}; // sv3_2 provides read-only access to s3
```

**String objects:** 

### Manipulating a string_view

Avoid using the `data` member function. Instead, use task-specific functions and
operators. For example:

- Use member functions such as `substr`, `find`, and `compare`
- Use comparison operators and the insertion operator
- Use iterators to traverse underlying data (range for-loop)

Except for the erase function in std::string and the functions remove_prefix and remove_suffix in std::string_view, std::string_view is
a drop-in replacement for std::string. And string and string_view can be
implicitly created from each other. So, go ahead and replace. 

Cannot use string_view to extract a text data from a stream:

If you already have a string or a C-string
Parameters: `const std::string&` or `std::string-view&`?

- cost of creating string_view from string vs efficiency gained

Parameters: `const char* z` or `std::string-view&`

- clearly latter, even if the string_view takes adds a bit more inefficient

### Summary

[Link to heading](#1)
