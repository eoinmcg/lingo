
#/bin/bash

export USER=$(whoami)
YUICOMPRESSOR="/home/$USER/yuicompressor/build/yuicompressor-2.4.6.jar"

java -jar ${YUICOMPRESSOR} -o l.min.js lingo.js 
java -jar ${YUICOMPRESSOR} -o l.min.css lingo.css 

