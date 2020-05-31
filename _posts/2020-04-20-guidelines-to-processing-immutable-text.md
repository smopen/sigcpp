---
serial_number: 5
title: "Guidelines to processing immutable text"
date: 2020-04-20
authors: smurthys
cpp_level: intermediate
cpp_version: "C++17, C++20"
---

This post concludes the 3-part series on `std::string_view`: [Part 1](/2020/04/03/efficiently-processing-immutable-text)
focuses on the efficiency aspects, [Part 2](/2020/04/07/safely-processing-immutable-text)
focuses on the safety aspects, and Part 3 (this post) provides some guidelines on using
`std::string_view`.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; General guidelines

Overall, there are three ways to model immutable text: `char` arrays (including
C-strings), `std::string` ("string"), and `std::string_view`.

1. **Prefer string_view over `char` arrays (including C-strings)** even though
   'char` arrays use less memory. (String_view maintains both a pointer and a size
   for each array). This recommendation is because the memory savings obtained with an
   array is small compared to the safety obtained with a string_view. Also, working
   directly with an array often requires carrying array size in an additional variable
   (or requires computing length in case of C-strings).

2. **Prefer string_view over string** if many objects are created directly using a
   constructor or indirectly due to sub-string extraction using the `substr` function.
   Likewise, prefer string_view over string if many assignments are made.

3. **`const` qualify immutable data**. In a situation where data is mutable and a part
   of the code performs immutable operations, refactor the part with immutable
   operations into a separate function and receive `const` parameters in the new
   function.

4. **Model compile-time constants as string_view** instead of character arrays or string
   objects.

5. **Mark compile-time constants `constexpr`** if the increased compilation time is
   acceptable. (Excessive use of `constexpr` could significantly increase compile time
   for large programs.)

```cpp
const char z1[]{"hello"};            // "lighter" than string_view but less safe
const std::string s1{"hello"};       // heavier and slower than string_view
const std::string_view sv1{"hello"}; // see the note on const qualification

constexpr char z2[]{"hello"};
constexpr std::string s2{"hello"};       // since C++20
constexpr std::string_view sv2{"hello"}; // NB: constexpr also means const
```

**Note:** Data in a string_view is immutable even if the string_view is not `const`
qualified. The effect of`const` qualification is to prevent assignment and the use of
[modifiers]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} )
`remove_prefix`, `remove_suffix`, and `swap`.

It is good practice to `const` qualify string_views and selectively remove the
qualification if assignment or modification is required.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; "Run-time" data

If text is read at run time and the text is immutable after reading it in, model the text
as `char` array or string object and create a string_view after the text is read. This
2-step approach is required because, expectedly, string_view does not provide any means
to read text.

```cpp
char z3[10];                // z3 cannot be const
std::cin >> z3;             // safe only if fewer than 10 chars are read
std::string_view sv3_1{z3}; // sv3_1 provides read-only access to z3

std::string s3;             // s3 cannot be const
std::cin >> s3;             // safe to read large amount of text
std::string_view sv3_2{s3}; // sv3_2 provides read-only access to data in s3
```

### Character arrays

Use string_view if it is necessary to work equally with both C-strings and a `char` array 
that is not null terminated. Using string_view expands the contexts in which code can be
used while also increasing safety and reducing the amount code needed to work with both
kinds of arrays. For example, consider function `vowel_count` shown in
[Listing D of Part 2](/2020/04/07/safely-processing-immutable-text#listing-d). The
string_view overload works for both kinds of `char` arrays, but the `const char*`
overload works only for C-strings.

Use string_view instead of a character array if you need to also track the size of a
character array. This is often the case.

### String objects


### Manipulating a string_view

Avoid using the `data` member function. Instead, use task-specific functions and
operators. For example:

- Use member functions such as `find`, `substr`, `front`, `back`, and `copy`
- Use iterators for traversal: for cleaner code, use range-based for loops when possible
- Use operators such as subscript, comparison, and insertion
- Use `at` function only if bounds checking is required

Listing A shows poor and good ways to copy data:

Do not cast away `const` 

Except for the erase function in std::string and the functions remove_prefix and remove_suffix in std::string_view, std::string_view is
a drop-in replacement for std::string. And string and string_view can be
implicitly created from each other. So, go ahead and replace. 

If you already have a string or a C-string
Parameters: `const std::string&` or `std::string-view&`?

- cost of creating string_view from string vs efficiency gained

Parameters: `const char* z` or `std::string-view&`

- clearly latter, even if the string_view takes adds a bit more inefficient

### Summary

[Link to heading](#1)
