"use strict";


/* 
*  markdown-frontmatter to annotations converter for patternlab
* 
*  walk the patterns dirs and look for markdown files
*  for every markdown file parse its content
*  add its content to the annotations array
*  when all files have been walked write to annotations.js
*/


var fs = require('fs')
var fm = require('front-matter')
var path = require("path")
var walk = require("walk")
var marked = require("marked")
var Rx = require("rx")
 

var path = "../chefkoch/living-styleguide/source"
var walker = walk.walk(path+"/_patterns")
var annotations = []


var readFileStream = Rx.Observable.fromNodeCallback(fs.readFile)
var walkerStream = Rx.Observable.fromEvent(walker, "file", function(root,stats,next){ return {root:root,stats:stats,next:next}})
var walkerStreamEnd = Rx.Observable.fromEvent(walker, "end")


/* main logic */
walkerStream
    .filter(isMarkdown)
    .map(readFileToStream)
    .switch()
    .map(parseFrontmatterFromBuffer)
    .takeUntil(walkerStreamEnd)
    .subscribe(addAnnotation, err, writeAnnotationsToDisk)


/* helpers */
function isMarkdown(file){
    var regex = /(\.md)$/
    
    file.next()

    return (regex.test(file.stats.name)) // is extension .md ?
}


function readFileToStream(file){
    return readFileStream(file.root+'/'+file.stats.name)
}


function parseFrontmatterFromBuffer(buffer){
    return fm(buffer.toString('utf8'))
}


// TODO: implement arbitrary attributes for special purposes
function addAnnotation(data){
    var annotation = {
        el: data.attributes.selector,
        title: data.attributes.title,
        comment: marked(data.body)
    }
    annotations.push(annotation)
}


function writeAnnotationsToDisk(){
    var content = "var comments = { 'comments':" + JSON.stringify(annotations) + "}"
    fs.writeFile(path+"/_data/annotations.js", content, function(err) {
        if(err) throw new Error(err)
        console.log("File was saved!")
    })
}


function err(err){
    console.log("Error")
    console.log(err)
}