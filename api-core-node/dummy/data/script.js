
// import { data } from "./aptitude";

import { data } from "./core.js";

// import { data } from "../data2.js";


let set = {};
// console.log(data);
let count = 0;

for (let i = 0; i < data.length; i++) {
  let elem = data[i].question; // use unique key like `question` as identifier
  if (set[elem]) {
    // console.log("Not unique:", elem);
    count++;
  }
  set[elem] = true;
}
console.log(count);
