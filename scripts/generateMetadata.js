const { contractMetadata, assetMetadata } = require('../assets/template');
const fs = require('fs');

async function main() {
  assetMetadata.map((md, index) => {
    const fileName = `assets/metadata/${index+1}`;
    fs.writeFileSync(fileName, JSON.stringify(md), (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(fileName, 'written');
    });

    return fileName;
  });

  fs.writeFileSync(
    'assets/metadata/contract',
    JSON.stringify(contractMetadata),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log('assets/metadata/contract', 'written');
    }
  );  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
