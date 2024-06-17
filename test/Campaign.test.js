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

  it('marks caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it('allows people to contribute money and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      value: '101',
      from: accounts[1],
    });
    const isApprover = await campaign.methods.approvers(accounts[1]).call();
    assert(isApprover);
  });
  it('requires a minimum contribution', async () => {
    try {
      await campaign.methods.contribute().send({
        value: '10',
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
  it('allows a manager to make a payment request', async () => {
    const newRequest = await campaign.methods
      .createRequest('Buy batteries', '100', accounts[2])
      .send({
        from: accounts[0],
        gas: '10000000',
      });
    const request = await campaign.methods.requests(0).call();
    console.log(request);
    assert.equal('Buy batteries', request.description);
  });
  it('processes requests', async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether'),
    });
    await campaign.methods
      .createRequest(
        'Buy batteries',
        web3.utils.toWei('5', 'ether'),
        accounts[1]
      )
      .send({
        from: accounts[0],
        gas: '10000000',
      });
    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: '10000000',
    });
    await campaign.methods.finaliseRequest(0).send({
      from: accounts[0],
      gas: '10000000',
    });
    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);
    console.log({ balance });
    assert(balance > 104);
  });
});
