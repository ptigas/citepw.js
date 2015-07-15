# citepw.js

Bibtex + HTML = :heart:

# How to use

Add this to include your bibliography

     <script type="application/bibtex" data-target="bibliography" src="bibliography.bib">

The target is a div that holds the citations. For example, that's how to include bibliography with `ieee` style.

	<div class="bibliography" data-csl="ieee"></div>`

To invoke the citations processor, include this

	<script type="text/javascript" src="citepw.js"></script>`

Boom!