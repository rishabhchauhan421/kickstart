const assert = require('assert');
const { Web3 } = require('web3');
const ganache = require('ganache');

const web3 = new Web3(ganache.provider());

const compiledCampaignFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaign;
let campaignAddress;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  //   console.log(compiledCampaignFactory.abi);
  factory = await new web3.eth.Contract(compiledCampaignFactory.abi)
    .deploy({
      data: compiledCampaignFactory.evm.bytecode.object,
    })
    .send({
      from: accounts[0],
      gas: '10000000',
    });

  await factory.methods.createCampaign('100').send({
    from: accounts[0],
    gas: '10000000',
  });

  //Fetching addresses from newly deployed Campaign and assigning it a variable
  const addresses = await factory.methods.getDeployedCampaign().call();
  campaignAddress = addresses[0];

  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe('Campaigns', () => {
  it('deploys a factoryCampaign', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });
});
