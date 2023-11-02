  const { ethers } = require('hardhat');

  async function main() {
    const oWIG = '0x60c08737877a5262bdb1c1cAC8FB90b5E5B11515 ';
    const vWIG = '0x8D05Ef8093A746101cEE1A0578eDd277f3Ecd6c1 ';
    const merkleRootOWIG = '0x7c9d1337f660c4f8feb1551aa9114982b53d36ae6937242343351299304ab5b2';
    const merkleRootVWIG = '0x6cb377e2ee93775e4fc8392cb5f96c68e7f0008285439b15cfdf65c3cd1f348b';
  
    const MerkleClaim = await ethers.getContractFactory('MerkleClaim');
    const merkleClaim = await MerkleClaim.deploy(
      oWIG,
      vWIG,
      merkleRootOWIG,
      merkleRootVWIG
    );
  
    await merkleClaim.deployed();
  
    console.log('MerkleClaim deployed to:', merkleClaim.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  