import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

// (2)
const data = fs.readFileSync("prehacked_addresses/addresses.csv")
const lines = data.toString().split("\n");
const values = lines.filter(e=>e.length > 43).map(e=>{
    return [e.split(",")[0], "0"]
})

console.log(values)
const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

// (3)
console.log('Merkle Root:', tree.root);

// (4)
fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));
