#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

// Function to find files matching the pattern in a directory
var findFilesInDirectory = function (dir) {
  return new Promise(function (resolve, reject) {
    fs.readdir(dir, function (err, files) {
      if (err) return reject(err);
      var matchingFiles = files.filter(function (file) {
        return file.startsWith('ai-studio-output-') && file.endsWith('.txt');
      });
      var fullPaths = matchingFiles.map(function (file) {
        return path.join(dir, file);
      });
      resolve(fullPaths);
    });
  });
};

// Function to read and concatenate files
var concatenateFiles = function (files) {
  return new Promise(function (resolve, reject) {
    var fileContents = [];
    var readNextFile = function (index) {
      if (index === files.length) {
        // Join all file contents with 2 newlines and resolve
        resolve(fileContents.join('\n\n'));
        return;
      }

      fs.readFile(files[index], 'utf8', function (err, data) {
        if (err) return reject(err);
        fileContents.push(data);
        readNextFile(index + 1); // Continue to the next file
      });
    };

    // Start reading files
    readNextFile(0);
  });
};

// Main IIFE logic
(function () {
  var directoryPath = '/home/srghma/Downloads'; // Directory to search in
  var outputFile = path.join(directoryPath, 'concatenated_output.txt'); // Output file path

  (async function () {
    try {
      // Find all matching files in the directory
      var files = await findFilesInDirectory(directoryPath);

      if (files.length === 0) {
        console.log('No matching files found.');
        return;
      }

      // Concatenate the contents of the files
      var concatenatedContent = await concatenateFiles(files);

      // Write the concatenated content to the output file
      fs.writeFile(outputFile, concatenatedContent, 'utf8', function (err) {
        if (err) {
          console.error('Error writing to output file:', err);
        } else {
          console.log('Concatenated content has been written to:', outputFile);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  })();
})();
