# Jedmatex

Javacsript library to create WYSIWYG equation editor in HTML.

This library makes it possible to edit equations directly on an HTML page.

![sample page](https://github.com/t-edson/Jedmatex/blob/0.4/screen1.png?raw=true)


# Installation

No special installation is required, just download the file "jedmatex.js" and include the reference in the HTML code. Jquery is required, so it must be included too.:

```
   <script src="//code.jquery.com/jquery-1.12.0.min.js"></script>
   <script src="jedmatex.js"></script>
```


## Use

The library converts a simple \<div\> to a equation editor.

To set a \<div\>, we use the function set_matex_node():

```
   <div class="matequ"></div>
   </div>
   <script>
      set_matex_node('.matequ');
   </script>
```
