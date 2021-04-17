# Jedmatex

Javacsript library to create WYSIWYG equation editor in HTML.

This library makes it possible to edit equations directly on an HTML page.



# Installation

No special installation is required. The code of the library just includes:

- A PHP file: phcontrols.php
- A SCSS file: phcontrols.scss

SASS is used to create the Style sheet, but a common CSS file is included too.

To use the PHP library, just copy the files in an accesible path and includes the following code in a PHP file:

```
<?php
include 'phcontrols.php';
...

?>
```



## Sample Code

Hello World page can be created in a file index.php with the following code:

```
<head>
	<link rel="stylesheet" href="phcontrols.css">
</head>
<body>
	<?php
	include 'phcontrols.php';
	startBlock('My Block');
	echo 'Hello world';
	endBlock();
	?>	
</body>
```

The output would be:

![sample page](https://github.com/t-edson/phcontrols/blob/0.2/_screens/sample1.png?raw=true)

