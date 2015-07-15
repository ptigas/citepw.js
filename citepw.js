var start = new Date().getTime();

( function( window, undefined ) {

    var citations = [];

    var target = "";

    // Initialize a system object, which contains two methods needed by the
    // engine.
    var citeprocSys = {
        // Given a language tag in RFC-4646 form, this method retrieves the
        // locale definition file.  This method must return a valid *serialized*
        // CSL locale. (In other words, an blob of XML as an unparsed string.  The
        // processor will fail on a native XML object or buffer).
        retrieveLocale: function (lang){
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'locales-' + lang + '.xml', false);
            xhr.send(null);
            return xhr.responseText;
        },

        // Given an identifier, this retrieves one citation item.  This method
        // must return a valid CSL-JSON object.
        retrieveItem: function(id){
            if (citations) {
                return citations[id];
            } else {
                console.log("this.citations is not defined");
            }
        }
    };

    var parse_date = function(year, month, day)
    {
        var date_parts = [];
        var stop = false;
        year && !stop ? date_parts.push(year) : stop = true;
        month && !stop ? date_parts.push(month) : stop = true;
        day && !stop ? date_parts.push(day) : stop = true;
        
        return date_parts;
    }

    var toCiteJSON = function(json) {
        out = '';
        res = [];
        for ( var i in json) {
            if (json[i].citationKey)
            {               
                var citationKey = json[i].citationKey;

                json[i]['id'] = citationKey;
                res[citationKey] = json[i];             
                res[citationKey]['type'] = json[i].entryType.toLowerCase();
                for (var j in res[citationKey].entryTags)
                {
                    var k = j.toLowerCase();
                    res[citationKey][k] = res[citationKey].entryTags[j];                    
                }

                // parse date
                res[citationKey]["issued"] = eval({"date-parts": [
                    parse_date(res[citationKey]['year'], res[citationKey]['month'], res[citationKey]['day'])
                    ]});
            }
        }
        return res;
    }

    // This runs at document ready, and renders the bibliography
    var renderBib = function(callback) {
        loadScript('bower_components/citeproc-js/xmldom.min.js', function() {
            loadScript('bower_components/citeproc-js/citeproc.min.js', function() {
            
                // Instantiate and return the engine
                //console.log(citations);

                var bibDivs = document.getElementsByClassName(target);
                for (var i = 0, ilen = bibDivs.length; i < ilen; ++i) {
                    var bibDiv = bibDivs[i];
                    var styleID = bibDiv.getAttribute('data-csl');

                    // Get the CSL style as a serialized string of XML
                    var xhr = new XMLHttpRequest();
                    
                    xhr.open('GET', 'csl-styles/' + styleID + '.csl', false);
                    xhr.send(null);
                    var styleAsText = xhr.responseText;

                    var citeproc = new CSL.Engine(citeprocSys, styleAsText);

                    var itemIDs = [];
                    var citationsSet = {};
                    for (var key in citations) {
                        itemIDs.push(key);
                        citationsSet[key] = true;                  
                    }
                    
                    citeproc.updateItems(itemIDs);
                    var bibResult = citeproc.makeBibliography();  
                    
                    var res = bibResult[1].join('\n');                
                    bibDiv.innerHTML = res;                    

                    var citekeys = document.body.innerHTML.match(/\\cite{([^}]*)}/g);
                    for (var k in citekeys)
                    {                        
                        var citekey = citekeys[k].substring(6, citekeys[k].length - 1);
                        if (citationsSet[citekey])
                        {
                            var replacement = citeproc.makeCitationCluster([{"id": citekey }]);     
                            console.log(replacement);
                            var replacement_inner = replacement.substring(1, replacement.length - 1);
                            //document.body.innerHTML = document.body.innerHTML.replace(replacement_inner, '<span class="citation_key" id="cite_'+citekey+'">' + replacement_inner + '</span>');
                            document.body.innerHTML = document.body.innerHTML.replace("\\cite{" + citekey + "}", '<a href="#cite_' + citekey + '">' + replacement + '</a>');
                        }                        
                    }

                    /*
                    for (var key in citations) {
                        document.body.innerHTML = document.body.innerHTML.replace("\\cite{" + key + "}", "Yow");
                    }
                    */

                    callback();
                }
            });
        });        
    };

    var loadScript = function(url, callback) {
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        if (callback) {
            script.onreadystatechange = callback;
            script.onload = callback;
        }    

        // Fire the loading
        head.appendChild(script);
    };

    var parseCitations = function()
    {
        loadScript('bower_components/zotero-bibtex-parse/zotero-bibtex-parse.js', function() {
            var scripts = document.getElementsByTagName("script");
            var bibTexTags = [];
            for (var i = 0, n = scripts.length; i < n; i++) {
                if (scripts[i].getAttribute("type") == "application/bibtex") {

                    // check src tag
                    if (scripts[i].getAttribute("src"))
                    {
                        var src = scripts[i].getAttribute("src");

                        // Get the CSL style as a serialized string of XML
                        var xhr = new XMLHttpRequest();                        
                        xhr.open('GET', src, false);
                        xhr.send(null);
                        var response = xhr.responseText;                        
                        bibTexTags.push(response);
                    } 
                    else
                    {
                        bibTexTags.push(scripts[i].innerText);
                    }
                    
                    target = scripts[i].getAttribute("data-target");
                }
            }    
            var bibtex = bibTexTags[0];            
            var sample = bibtexParse.toJSON(bibtex);
            console.log(bibtex);
            citations = toCiteJSON(sample);        
        });        
    };

    var CitePw = function() {
        this.run = function run(callback) {            
            parseCitations();
            renderBib(callback);
        };
    };

    // expose access to the constructor
    window.CitePw = CitePw;
  
} )( window );

var app = new CitePw();
app.run(function() { document.getElementById("loading").style.display = 'none'; });

var end = new Date().getTime();
var time = end - start;
console.log('Execution time: ' + time);