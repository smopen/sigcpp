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

Overall, there are three ways to model immutable text: character arrays (including
C-strings), `std::string` ("string"), and `std::string_view`.

1. **Do not let a string_view object outlive the data it wraps**. This issue is discussed
   and illustrated in [Part 2] ( {{ '/2020/04/07/safely-processing-immutable-text#4' | relative_url }} ).

2. **Prefer string_view over character arrays (including C-strings)** even though
   'char` arrays use less memory. (String_view maintains both a pointer and a size
   for each array). This recommendation is because the memory savings obtained with an
   array is small compared to the safety obtained with a string_view. Also, working
   directly with an array often requires carrying array size in an additional variable
   (or requires computing length in case of C-strings).

3. **Prefer string_view over string** if many objects are created directly using a
   constructor or indirectly due to sub-string extraction using the `substr` function.
   Likewise, prefer string_view over string if many assignments are made.

4. **`const` qualify immutable data**. In a situation where data is mutable and a part
   of the code performs immutable operations, refactor the part with immutable
   operations into a separate function and receive `const` parameters in the new
   function.

5. **Model compile-time constants as string_view** instead of character arrays or string
   objects.

6. **Mark compile-time constants `constexpr`** if the increased compilation time is
   acceptable. (Excessive use of `constexpr` could significantly increase compile time
   for large programs.)

   ```cpp
   const char z1[]{"hello"};            // lighter than string_view; less safe
   const std::string s1{"hello"};       // heavier and slower than string_view
   const std::string_view sv1{"hello"}; // see the note on const qualification

   constexpr char z2[]{"hello"};
   constexpr std::string s2{"hello"};       // since C++20
   constexpr std::string_view sv2{"hello"};
   ```

   **Note:** Data in a string_view is immutable even if the string_view is not `const`
   qualified. The effect of`const` qualification is to prevent assignment and the use of
   [modifiers]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} )
   `remove_prefix`, `remove_suffix`, and `swap`.

   It is good practice to `const` qualify string_views and selectively remove `const` if
   assignment or modification is required.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; "Run-time" data

{:start="7"}

7. If text is read at run time and the text is immutable after reading it in, model the
   text as character array or string object and create a string_view after the text is
   read. This 2-step approach is required because, expectedly, string_view does not
   provide any means to read text.

   ```cpp
   char z3[10];                // z3 cannot be const
   std::cin >> z3;             // safe only if fewer than 10 chars are read
   std::string_view sv3_1{z3}; // sv3_1 provides read-only access to z3

   std::string s3;             // s3 cannot be const
   std::cin >> s3;             // safe to read large amount of text
   std::string_view sv3_2{s3}; // sv3_2 provides read-only access to data in s3
   ```

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Specific to character arrays (including C-strings)

**Note:** For ease of writing, this section uses the term `char` array to mean a `char`
array that is not null-terminated.

8. **Use string_view instead of C-strings and `char` arrays** if find, sub-string,
   comparison, and iteration operations are required. All of these operations are much
   safer than directly performing those operations on arrays. However, it is OK use
   arrays directly if they are simply read and written (meaning practically no text
   processing).

9. **Use string_view instead of `char` array if array size should also be tracked**,
   which is quite often necessary as evidenced in functions such as `strncpy`, `strncmp`,
   `memcpy`, and `memcmp`. In fact, only a local array (with automatic storage) can ever
   be used without explicitly knowing its size, and even that use is limited to the
   `sizeof` operator and range-based for loops (as illustrated in [this program](https://godbolt.org/z/cPhXF3)).
   
10. **Use string_view if the code should work equally for C-strings and `char` arrays.**
   Using string_view expands the contexts in which code can be used while also improving
   efficiency, safety, and maintainability.

    For example, consider function `vowel_count` in [Listing D of Part 2]( {{ '/2020/04/07/safely-processing-immutable-text#listing-d' | relative_url }} ).
   The string_view overload there works for both C-strings and `char` arrays, but the
   `const char*` overload works only for C-strings; not for char `arrays`. Indeed, anyone
   attempting [Exercise 4 of Part 2] ( {{ '/2020/04/07/safely-processing-immutable-text#6' | relative_url }} )
   quickly sees that supporting `vowel_count` for char arrays results in inefficient
   code, redundant code, or somewhat convoluted (less maintainable) code.

11. **Avoid using a C-string or `char` array directly while it is also wrapped in a
   string_view**, or do so with a lot care. The mixture can make it hard to reason about
   code, especially if the data is modified (by an obscure function). For example, avoid
   mixing access such as the following. In this particular case, the code should probably
   use a string object instead of C-string or string_view, or it should separate the
   mutable and immutable parts into different functions and still be careful when
   interleaving calls to the new functions.

    ```cpp
    char z[]{"hello"};
    std::string_view sv(z);
    strncpy(z+1, "a", 1);    // include <cstring>
    std::cout << sv;
    ```

12. **Do not cast away `const`ness of data in a string_view**. In addition to mixing
   mutable and immutable operations against the preceding guidance, having to remove
   `const`ness likely means the program design needs to be reviewed.
   
    If `const`ness must be removed (say a third-party function requires that), [copy](https://en.cppreference.com/w/cpp/string/basic_string_view/copy)
    the string_view data to another array and work on the copy. However, the copy and the
    string_view data are not synchronized. If string_view's data should match the copy
    after it is worked on, assign the copy to the string_view.

    I recommend studying [this program](https://godbolt.org/z/HHfAsw) prepared to
    illustrate some means and side effects of removing `const`ness from string_view data.
    The program also includes an example of copying string_view data, changing the copy,
    and then assigning the changed copy back to string_view.

13. **Replace `const` C-string or `char` array parameters with string_views**. However,
    it is OK to receive a C-string or a `char` array parameter and create a string_view
    only at an appropriate juncture within the function. This guidance is motivated by
    the desire to get the benefit of using string_view but prevent premature creation of string_view object in the calling function, if the called function is less likely or
    unlikely to use the parameter.

    If a function receives a non-const C-string or `char` array parameter, check if
    the function really performs mutable operations. If it does not, add `const`
    qualification to the parameter or change the parameter to string_view.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Specific to string objects

Except for the erase function in std::string and the functions remove_prefix and remove_suffix in std::string_view, std::string_view is
a drop-in replacement for std::string. And string and string_view can be
implicitly created from each other. So, go ahead and replace. 

If you already have a string
Parameters: `const std::string&` or `std::string-view&`?

- cost of creating string_view from string vs efficiency gained

Parameters: `std::string-view&`

- clearly latter, even if the string_view takes adds a bit more inefficient

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Manipulating a string_view

**Avoid using the `data` function directly.** Instead, use task-specific functions and
operators. For example:

- Use member functions such as `find`, `substr`, and `copy`
- Use iterators for traversal: for cleaner code, use range-based for loops when possible
- Use operators such as subscript, comparison, and insertion

**Check string_view size before accessing data** unless it is certain that the string_view
cannot be empty. The subscript operator as well as functions `front` and `back` do
**not** check bounds and thus have undefined behavior if size is zero. Use [`at` function](https://en.cppreference.com/w/cpp/string/basic_string_view/at)
if bounds checking is required.

**Prefer subscript operator over `at` function for greater speed** and if it is certain
that data cannot be empty.

Listing A shows poor and good ways to copy data:

### Summary

[Link to heading](#1)
