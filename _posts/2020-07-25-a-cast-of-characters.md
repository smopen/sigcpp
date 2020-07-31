---
pid: 9
title: "A cast of characters"
date: 2020-07-25
authors: smurthys
cpp_level: intermediate
cpp_versions: ["C++11", "C++20"] 
reader_activity: exercise
---

C++ supports five types of character data: `char`, `wchar_t` since forever; `char16_t`
and `char32_t` since C++11; and `char8_t` since C++20. Data of each of these types
stores an integral value of the "underlying type". The exact value stored for any
character in any of the five types is implementation dependent.

This post introduces the five character types with the goal of providing some building
blocks for later posts.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; `char`

The `char` type is large enough to represent any character in the implementation's
"basic character set". In implementations using [ASCII](https://en.wikipedia.org/wiki/ASCII)
as the basic character set, size of `char` is one physical byte (8 bits). However, in
implementations using UTF-16, size of `char` is two physical bytes (16 bits). (Section 2
discusses UTF.)

{% include start-aside kind="warn" show_icon=true %}

In C++, size of `char` is always `1` regardless of the number of physical bytes needed to
represent any character in an implementations' basic character set. For example, if the
implementation represents `char` data using two physical bytes, size of `char` is still
`1` and a "byte" would actually be 16 bits long. However, it is rare for `char` data to
use more than one physical byte (8 bits) because most implementations use some form of
ASCII as their basic character set.

{% include end-aside %}

C++ also defines the types `signed char` and `unsigned char` distinct from the `char`
type and an implementation may choose to represent `char` data as either `signed char` or
`unsigned char`. The exact choice of representation depends on the compiler and the
target platform.

By default, `char` is signed in both GCC and MSVC. It can be changed to unsigned using
the [`-funsigned-char`](https://gcc.gnu.org/onlinedocs/gcc-10.2.0/gcc/C-Dialect-Options.html#index-funsigned-char)
compiler option in GCC and the [`/J`](https://docs.microsoft.com/en-us/cpp/build/reference/j-default-char-type-is-unsigned?view=vs-2019)
compiler option in MSVC.

A `char` literal is one or more characters placed inside a pair of single quote marks.
It is called an *ordinary character literal* (informally also as *narrow literal*, in
contrast to "wide literal" which is of type `wchar_t`). If the literal contains more
than one character (for example, `'abc'`), it is called a *multi-character literal*. The
type of a single character literal is obviously `char`, but the type of a
multi-character literal is `int` and its exact value is implementation dependent. (See
Exercise 6.)

A multi-character literal is not to be mistaken for a [string literal]( {% include post-link id="1" %} )
which contains zero or more characters enclosed a pair of double quote marks, as in `""`
and `"abc"`.

{% include start-aside kind="info" %}

The macro constant `CHAR_MIN` is negative if `char` is represented as `signed char`; it
is zero if `char` is represented as `unsigned char`. Also, the macro constant `CHAR_BIT`
gives the number of physical bits in a C++ "byte". Both these constants are defined in
`<climits>`.

{% include end-aside %}

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Unicode and UTF overview

This section is a short detour to provide the necessary background for character types
other than `char`.

Unicode is an encoding system for characters where each character is assigned a "code
point" which is an integral value unique to the character. This arrangement is similar to
ASCII which encodes each character as a 7-bit integer. 

Unicode code points are expressed as 4-digit or 8-digit hexadecimal numbers and written
with the prefix `U+` For example, the character `$` has the code point `U+0024`, whereas
`€` has the code point `U+20AC`. (In comparison, ASCII assigns the code `0x24` to `$`,
and it does not define a code for `€`. [ISO 8859-15](https://en.wikipedia.org/wiki/ISO/IEC_8859-15),
which is an extension of ASCII, assigns the code `0xA4` to `€`.)

Unicode contains [143,859 characters](https://www.unicode.org/faq/basic_q.html) with
the largest code point being `U+10FFFF`. (Not all possible code points are used.). Thus,
in theory 21 bits are needed to represent every possible code point, but in reality up
to 32 bits are used (for reasons outside the scope of this post).

Unicode defines "Unicode transformation format" ([UTF]((https://www.unicode.org/faq/utf_bom.html))),
which is a scheme to map every Unicode code point to a sequence of code units, where a
code unit is 8 bits, 16 bits, or 32 bits. It defines three UTF variations named UTF-8,
UTF-16, and UTF-32 where code points are represented using a sequence of one to four
8-bit code units, or one to two 16-bit units, or one 32-bit unit, respectively. For
example, `$` is represented in all three UTF forms using exactly one code unit, but it
uses just one byte in UTF-8 (`0x24`), two bytes in UTF-16 (`0x0024`), and four bytes in
UTF-32 (`0x00000024`). However, `€` is represented using three code units (three bytes)
in UTF-8 (`0xE282AC`), one code unit (two bytes) in UTF-16 (`0x20AC`), and one code unit
(four bytes) in UTF-32 (`0x000020AC`).

In contrast to UTF-8 and UTF-16, UTF-32 is a fixed-length encoding scheme because every
Unicode code point fits in one 32-bit unit and is represented exactly as it is defined.
Thus, mapping a UTF-32 value to a Unicode code point requires no additional translation
effort. However, UTF-32 always uses 32 bits making it "space inefficient". UTF-8 on the
other hand is space efficient, but translating a variable-length UTF-8 value to a
Unicode code point is not straightforward. (Details omitted.)

In UTF-8 and UTF-16, a character is called **supplementary** if representing it needs
more than one unit of data. For example, `€` is a supplementary character in UTF-8
because its representation needs two 8-bit units. However, the same character is not
supplementary in UTF-16 because its representation needs just one 16-bit unit.

{% include start-aside kind="info" %}

The first 128 Unicode code points (`U+0000` to `U+007F`) and their corresponding
characters map directly to ASCII by design. These code points are defined in a Unicode
block called [C0 Controls and Basic Latin](http://www.unicode.org/charts/PDF/U0000.pdf).

{% include end-aside %}

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; `char8_t`, `char16_t`, and `char32_t`

Back to C++. The types `char8_t` (added in C++20), `char16_t`, and `char32_t` use UTF-8,
UTF-16, and UTF-32 representations, respectively. They occupy 8, 16, and 32 bits
respectively, and they do **not** permit the representation of supplementary characters.
That is, only characters whose code points occupy a single code unit may be used.

The following table lists some key characteristics of the three types.

|                   |`char8_t`      |`char16_t`           |`char32_t`           |
|:------------------|:--------------|---------------------|---------------------|
|Corresponding type |`unsigned char`|`std::uint_least16_t`|`std::uint_least32_t`|
|Largest value      | `0x7F`        |`0xFFFF`             |Unspecified          |
|Literal prefix     | `u8`          |`u`                  |`U`                  |

Here are some key points about the three types:

- `char8_t` has the same size and representation as `unsigned char`, but the two types
   are distinct. That is, `char8_t` is not a alias for `unsigned char`. 

- `char16_t` and `char32_t` have the same size and representation as the types
  `std::uint_least16_t` and `std::uint_least32_t`, respectively. However, each of the
  four types named here is a distinct type.

- The largest code point possible is not specified for `char32_t` because that type
  should be able to represent every Unicode code point. Presently, that value is `0x10FFFF` according to Unicode.

- No constants are defined for the largest code point. Only coincidentally, the macro
  constant `UINT_LEAST16_MAX` matches the largest code point for `char16_t`. Macro
  constants `UINT_LEAST18_MAX` and `UINT_LEAST32_MAX` are **not** aligned with the
  largest code points for `char8_t` and `char32_t`, respectively.

- Literals of these types are generally called "UTF literals", with the exact UTF scheme
  called out when it is necessary to distinguish the scheme, for example, UTF-8 literal.

- Both character and string literals are distinguished using a prefix: `u8`, `u`, or `U`
  for UTF-8, UTF-16, and UTF-32 respectively. Examples: `u8'$'`, `u'€'`, `U'€'`,
  `u8"AB"`, `u"€300"` and `U"€300"`.

- Multicharacter literals are **not** permitted.

- The literal prefix `u8` is new in C++17 to express UTF-8 literals though the type
  `char8_t` is introduced only in C++20.
  
- As with `char` literals, a UTF literal may embed Unicode code points in escape
  sequences to express characters using "universal character names" as in `u8'\u0024'`,
  `u'\u0024'`, and `U'\U00000024'`. The code point should have four hex digits if
  prefixed with `\u` and eight hex digits if prefixed with `\U`. Note that the
  literal-type prefix and the universal-name prefix are different from each other. For
  example, `u8'\u0024'`, `u'\u0024'`, and `U'\u0024'` are UTF-8, UTF-16, and UTF-32
  literals respectively, but all of them contain the character `$` expressed as the
  Unicode code point `U+0024`.

- Until C++17, inserting UTF-16 and UTF-32 data to an output stream causes the actual
  code point(s) to be inserted. For example, inserting `u'€'` inserts the number `20AC`; inserting `U"ABCD"` inserts `0x40206C`. (Result of string insertion depends on
  implementation and platform; example results shown assume numbers are formatted as hex.
  Study and run [this program](https://godbolt.org/z/M111bh) in both GCC and MSVC.)

- In C++17, inserting UTF-8 data to an output stream causes character(s) to be inserted.
   For example, inserting `u8'$'` inserts the character `$`; inserting `u8"ABCD"`
   inserts the string `ABCD`.

- Since C++20, the overloads for operator `<<` to insert UTF data to an output stream
  are **deleted**. For example, the following statement causes a compiler error:
  `std::cout << u8'a';`

{% include start-aside kind="info" %}

Java also [encodes character data as Unicode](https://docs.oracle.com/javase/specs/jls/se12/html/jls-3.html#jls-3.1)
using UTF-16 and does not permit supplementary characters. In this sense, Java's `char`
type is comparable to C++'s `char16_t`.

{% include end-aside %}

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; `wchar_t`

The `char` type is large enough to represent any character in the implementation's
"basic character set". If an implementation use the ANSI character set as its basic
character set, size of `char` is one byte. (Most implementations use ANSI as their basic
character set.)

C++ also defines the types `signed char` and `unsigned char` distinct from the `char`
type and an implementation may choose to represent `char` data as either `signed char` or
`unsigned char`. The exact choice of representation depends on the compiler and the
target platform.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Character and string literals

Fundamental types: https://en.cppreference.com/w/cpp/language/types

Character literals: https://en.cppreference.com/w/cpp/language/character_literal

String literals: https://en.cppreference.com/w/cpp/language/string_literal

Null-terminated wide strings: https://en.cppreference.com/w/cpp/string/wide

Null-terminated multibyte strings: https://en.cppreference.com/w/cpp/string/multibyte

`std::codecvt`: https://en.cppreference.com/w/cpp/locale/codecvt

`std::wstring_convert`: https://en.cppreference.com/w/cpp/locale/wstring_convert

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Overview


{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Character types






{% include bookmark.html id="3" %}

### 2.&nbsp;&nbsp; C-string literals

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; C-string variables

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Being a C-string is a property of a `char` array


{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Working with C-strings


{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; C-string versus NTBS


{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Exercises

In GCC, use `-Wall -Wextra -pedantic` compiler option; in MSVC use /W4 option.

1. Use the information in Section 1 to write a statement to print whether `char` data is
   signed or unsigned in an implementation.

2. In GCC, use the expression developed in Exercise 1 to verify that `char` data is
   signed by default. Then force the compiler to treat `char` as unsigned and verify that `char` data is indeed unsigned.

3. What would be the value of `CHAR_BIT` in an implementation where the basic character
   set is represented using UTF-32? What does the expression `sizeof(char)` return in
   this case?

4. Use the information in Section 1 to write a C++ expression to compute the number of
   physical bytes used to store an `int`. Or, write a function template to return the
   number of physical bytes used by any type `T`. Make the template as "efficient" as
   possible.

5. Write a C++ expression that does **not** use the technique described in Section 1 to
   test if `char` is signed or unsigned. (The answer I have in mind requires knowledge
   beyond introductory C++.)

6. In GCC, force integral values to be printed in hex and then print the following
   multi-character literals on consecutive lines: `'\0\0A'`, `'\0A\0'`, `'A\0B'`,
   `'ABCD'`, and `'ABCDE'`.

  {:start=a}

  1. What values does GCC print? What can we conclude about how the literals are
     translated to integer values and what is the most number of characters retained?

  2. What values does MSVC print? How is the compiler output different from GCC? How is
     the program output different from GCC (after deleting any erring code)?
