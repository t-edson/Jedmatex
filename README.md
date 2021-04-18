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

After that we must add the first operand to start the edition:

```
  <script>
	new o_opdo($main_ex, true)
  </script>
```

Then we can start writing the equation.

Operators such as addition or subtraction are written directly.

Operations like power or square root needs to be created using some functions of the library for special operations.

## Special operations

Special math operations are those that require special editing options.

Only the following operations have been implemented:

power

<div class="wrap opdo" style=""><div class="wrap opdo" style=""><span class="field " role="textbox" contenteditable="">x</span></div><div class="wrap opdr pow" style="font-size: 11.2px;"><div class="frame"><div class="wrap opdo" style="position: relative; "><span class="field " role="textbox" contenteditable="">2</span></div><div class="wrap" style="display: block; height: 11.2px;"></div></div></div><div class="wrap opdo" style=""><span class="field " role="textbox" contenteditable=""></span></div></div>

fraction 
square root
index



