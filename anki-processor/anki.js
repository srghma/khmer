// function checkLetters(array, arrayName) {
//   const invalidLetters = array.filter(item => Array.from(item.letter).length !== 1);
//   if (invalidLetters.length === 0) {
//     console.log(`${arrayName}: All letters are single characters ✅`);
//   } else {
//     console.log(`${arrayName}: These letters have more than one character:`);
//     invalidLetters.forEach(item => {
//       // Use trans, desc, or trans_a/trans_o if available
//       const translit = item.trans || item.desc || (item.trans_a && item.trans_o ? `${item.trans_a} / ${item.trans_o}` : "N/A");
//       console.log(`- ${item.letter} = ${JSON.stringify(Array.from(item.letter))} (${translit})`);
//     });
//   }
// }
// checkLetters(khmerConsonants, "khmerConsonants");
// checkLetters(khmerExtraConsonants, "khmerExtraConsonants");
// checkLetters(khmerVowels, "khmerVowels");
