---
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

### General guidelines {#1}

Overall, there are three approaches to model immutable text: `char` arrays (including
C-strings), `std::string` ("string"), and `std::string_view`.

1. **`const` qualify immutable data** regardless of the approach. In a situation where
   text data is mutable, and a part of the code performs immutable operations, refactor
   the part with immutable operations into a separate function and receive `const`
   parameters in that function.

2. **Prefer string_view over character arrays** even though character arrays are
   "lighter" (string_view maintains both a pointer and a size for each array)
   because the memory reduction with a bare array is small compared to the safety
   string_view provides. Also, working directly with an array often requires carrying array size in an additional variable (or requires computing size in case of C-strings).

3. **Prefer string_view over string** if many objects are created either directly using
   a constructor or due to sub-string extraction using the `substr` function.

4. **Model compile-time constants as string_view** instead of character arrays or string
   objects.

**Note:** The data in string_view is immutable even if it is not `const` qualified.
`const` qualification only prevents the use of [modifier functions]( {{ '/2020/04/03/efficiently-processing-immutable-text#modification-efficiency' | relative_url }} )
`remove_prefix`, `remove_suffix`, and `swap`.

```cpp
const char z{"hello"};              // lighter than string_view but less safe
const std::string s{"hello"};       // heavier and slower than string_view
std::string_view sv{"hello"};       // prefer; note the missing const qual.
```

### Run-time data

Reference [Section 1](#1).

First, only literal text (C-strings, char arrays, string literals, and string_view
literals) can start as string_view. No text that is read or constructed at run time can
be born a string_view, but instead born a `char` array or a `std::string` object (at
lease from the programmers' perspective). Thus, the choice of using string_view depends
on whether the data is

**String objects:** 

Programmers

Avoid using `data` function; remember that that function is not guaranteed to return a C-string. Instead use task-specific string_view functions and operators. For example:

- Use functions such as substr and find
- Use relational operators and the insertion operator
- Use iterators

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

