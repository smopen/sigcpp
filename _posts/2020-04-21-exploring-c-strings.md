---
title: "Exploring C-strings"
date: 2020-04-21
---

This post discusses the use of C-strings in C++ and highlights a subtle difference between C-strings 
and *null-terminated byte strings* defined in C++.  

But first, some advice: Avoid using C-strings in C++, and instead use `std::string` where possible.
However, there are situations where C-strings can provide better performance over `std::string`, 
but make that choice on a case-by-case basis. Even when using a C-string, consider using it with the 
light-weight wrapper `std::string_view`.
<!--more-->

### Terms

In C++, the informal term *C-string* is used to mean the "string" data structure defined in the C 
programming language as follows [[7.1.1](https://web.archive.org/web/20181230041359if_/http://www.open-std.org/jtc1/sc22/wg14/www/abq/c17_updated_proposed_fdis.pdf)]: 

> A *string* is a contiguous sequence of characters terminated by and including the first null 
> character.

The term *null character* refers to the character whose integer code is 0. The literal `'\0'` is the
null character. It is different from the literal `'0'` whose integer code is 48.

In contrast to C, a *string* in C++ is an abstract sequence of characters without regard for how the
characters are represented and whether the sequence ends with the null character. However, C++ 
defines the related term *null-terminated byte string* as follows [[byte.strings](https://timsong-cpp.github.io/cppwp/n4659/byte.strings)]:

> A *null-terminated byte string*, or NTBS, is a character sequence whose highest-addressed element 
> with defined content has the value zero (the *terminating null* character); no other element in 
> the sequence has the value zero.

C++ also defines the *length* of an NTBS as the number of elements that precede the terminating null
character. An NTBS of length 0 is called an "empty NTBS". C similarly defines the length of a string
as the number of bytes preceding the null character.

**Note:** When working with C++:
- Use the informal term "C-string", **not** "string", to mean the string data structure defined in C. 
- Use the term "string" only to mean an abstract sequence of characters without regard for how the 
  character sequence is represented. (`std::string` is a concrete implementation of this abstraction.)
- Use the term NTBS to actually mean a null-terminated sequence of characters as defined above. 
  (A subtle difference between C-strings and NTBSs is examined later in this post.)

### C-string Literals

A literal such as `"hello"` is a C-string ("static NTBS" to be precise). The compiler places the 
null character after the last character written inside the double quotes. 

The type of a C-string literal is `const char` array of the appropriate bound, where *bound* is the
declared number of array elements (aka "size" or "capacity"). For example, the type of the literal 
`"hello"` is `const char[6]` because storing that literal contains six characters including the 
null character.

The length of the literal `"hello"` is five, which is the number of characters preceding the null 
character. In general, the length of a C-string is one less than the bound of the character array 
that contains the C-string.

### C-string variables

The following code fragment declares six character-array variables, only four of which create 
C-strings. The end-of-line comments provide additional information for each array.

**Note:** As the examples show, every C-string is a character array, but not every character array 
is a C-string.

```cpp
char s1[]{'h', 'e', '\0'}; // C-string; bound 3; length 2; explicit null char at position 3
char s2[]{'h', 'e', 'r'};  // not C-string; bound 3; no null char

char s3[7];                // not C-string; bound 7; no null char

char s4[]{"he"};           // C-string; bound 3; length 2; automatic null char at position 3
char s5[10]{"he"};         // C-string; bound 10; length 2; auto null char at position 3
```

### C-string is not a data type

There is no data type called C-string. Instead, being a C-string is just a property of a character 
array based on whether it meets the requirements of containing the null character, and this property
can change over time for an array within the program. That is, a character array could be a C-string 
at one point in the program, and not be a C-string at another point in the same program. The 
following code segment illustrates this possibility.

```cpp
char s6[]{'h', 'e', '\0'}; // C-string; null char at position 3
s6[2] = 'r';               // no longer a C-string: null character replaced
s6[2] = '\0';              // C-string again: null character restored
```

### Working with C-strings

The C++ library includes many functions that operate on C-strings. These functions are defined in 
the header `<cstring>` [[[cstring.syn]](https://timsong-cpp.github.io/cppwp/n4659/c.strings#cstring.syn)]. Example functions: `strlen` to find length; `strcpy` to copy a C-string to another; and `strcmp` to compare a C-string with another.

In addition, the insertion operator `<<` on output streams is overloaded to output C-strings.

A function that operates on a C-string typically has a parameter of type `char*`, with the 
expectation that the caller passes a pointer to the first character of the C-string. It is not 
necessary to also receive the C-string's length because the function can use the null character to 
detect end of data.

**Note:** For safety and other reasons, prefer `std::string` when working with character data. If 
you must use a C-string, consider using it with the light-weight wrapper `std::string_view`.

### Multiple null characters (or C-string Vs NTBS)

Reviewing C's definition of string, it is clear that C does not preclude multiple null characters, 
but it deems a string to have ended as soon as the first null character is seen. That is, a C-string
is a character array with at least once occurrence of the null character.

> A *string* is a contiguous sequence of characters terminated by and including the first null 
> character.

However, reviewing the C++ definition of NTBS, it is clear that an NTBS must end with the null 
character and the null character may appear only once:

> A *null-terminated byte string*, or NTBS, is a character sequence whose highest-addressed element 
> with defined content has the value zero (the *terminating null* character); no other element in 
> the sequence has the value zero.

That is, C-strings and NTBSs are subtly different when it comes to the number of null character 
occurrences permitted and the location of the null character. However, I have yet to encounter any 
situation where this subtlety causes an issue. If an array with multiple null characters, or 
misplaced null character, is used where an NTBS is expected, only the portion of the array until the
first occurrence of the null character is processed. That is, in practice, an NTBS is treated just 
as a C-string.

**Conclusion:** For all practical purposes, the terms C-string and NTBS may be used interchangeably,
but beware of the subtle difference, especially if you are arguing a point, or if you are in a job 
interview or other such scenario.

The character arrays in the following code segment create valid C-strings but not valid NTBSs. 

```cpp
#include <iostream>
#include <cstring>

int main() {
    char s7[]{'h', 'e', '\0', 'r', '\0'}; // explicit null char at positions 2 and 4
    char s8[]{"hello\0World"};            // explicit null char at position 5

    std::cout << s7 << '\n';              // prints "he": ignores chars after position 2
    std::cout << std::strlen(s8) << '\n'; // prints 5: ignores chars after position 5
}
```

**Quiz:** Strictly adhering to the definitions of C-string and NTBS:
1. Which of the following declarations create C-strings? 
2. Which declarations create NTBSs? 
3. What is the bound of each array declared?
4. What is the length of each C-string created?

(The empty initializer `{}` in an array declaration writes the number zero to all array elements.)

```cpp
char s9[]{'h', 'e'};
char s10[]{"he\0"};
char s11[4]{};
char s12[1]{};
```