import React, { Component } from 'react';  
import Web3 from 'web3'  
import TruffleContract from 'truffle-contract'  
import Tokens from './Tokens/all';  
import Nav from './Components/Nav';  
import Description from './Components/Description';  
import Container from './Components/Container';  
import InstallMetamask from './Components/InstallMetamask';  
import UnlockMetamask from './Components/UnlockMetamask';  
import TokenZendR from './build/contracts/TokenZendR.json';  
  
class App extends Component {  
  constructor(){  
      super();  
    
      this.tokens = Tokens;  //list of supported tokens by token-zendr contract
      this.appName = 'TokenZendR';  
      this.isWeb3 = true; //If metamask is installed  
      this.isWeb3Locked = false; //If metamask account is locked  
      
      //bind this methods to enable them change state from children components
      this.newTransfer = this.newTransfer.bind(this);  
      this.closeTransfer = this.closeTransfer.bind(this);  
      this.onInputChangeUpdateField = this.onInputChangeUpdateField.bind(this);  
      
      this.state = {  
          tzAddress: null,          //address of the token-zendr contract
          inProgress: false,        //if a transfer action is in progress
          tx: null,                 //tx returned after a successfull transaction
          network: 'Checking...',   //default message to show while detecting network
          account: null,            //address of the currently unlocked metamask
          tokens: [],               //list of supported tokens owned by the user address
          transferDetail: {},  
          fields: {                 //form fields to be submitted for a transfer to be initiated 
              receiver: null,  
              amount: null,  
              gasPrice: null,  
              gasLimit: null,  
         },     
         defaultGasPrice: null,     
         defaultGasLimit: 200000  
      };  
      
      let web3 = window.web3;  
      
      //set web3 & truffle contract
      if (typeof web3 !== 'undefined') {  
          // Use Mist/MetaMask's provider  
          this.web3Provider = web3.currentProvider;  
          this.web3 = new Web3(web3.currentProvider);  
          
          this.tokenZendr = TruffleContract(TokenZendR);  
          this.tokenZendr.setProvider(this.web3Provider);  
          
          if (web3.eth.coinbase === null) this.isWeb3Locked = true;  
  
     }else{  
      this.isWeb3 = false;  
     } 
 }  
 
  //switch statement to check the current network and set the
  //value to be displayed on the nav component 
  setNetwork = () => {  
      let networkName,that = this;  
      
      this.web3.version.getNetwork(function (err, networkId) {  
      switch (networkId) {  
      case "1":  
          networkName = "Main";  
          break;  
      case "2":  
          networkName = "Morden";  
          break;  
      case "3":  
          networkName = "Ropsten";  
          break;  
      case "4":  
          networkName = "Rinkeby";  
          break;  
      case "42":  
          networkName = "Kovan";  
          break;  
      default:  
          networkName = networkId;  
     }  
     
     that.setState({  
          network: networkName  
       })  
    }); 
 };  
 
 //When a new transfer is initiated
 //set details of the token to be
 //transfered such as the address, symbol.. etc
  newTransfer = (index) => {  
      this.setState({  
      transferDetail: this.state.tokens[index]  
     }) 
 }; 
  
  //Called at the end of a successful
  //transfer to cclear form fields & transferDetails
  closeTransfer = () => {  
      this.setState({  
          transferDetail: {},  
          fields: {},  
     }) 
 };  
     
  setGasPrice = () => {  
      this.web3.eth.getGasPrice((err,price) => {  
          price = this.web3.fromWei(price,'gwei');  
          if(!err) this.setState({defaultGasPrice: price.toNumber()})  
     }); 
 };  
 
  setContractAddress = ()=> {  
      this.tokenZendr.deployed().then((instance) => {  
      this.setState({tzAddress: instance.address});  
     }); 
 };  
 
 //Reset app state
  resetApp = () => {  
      this.setState({  
          transferDetail: {},  
          fields: {  
              receiver: null,  
              amount: null,  
              gasPrice: null,  
              gasLimit: null,  
         },  
         defaultGasPrice: null,  
     })
  };  
 
  Transfer = () => {  
      //Set to true to allow some component disabled
      //and button loader to show transaction progress
      this.setState({  
          inProgress: true  
      });  
      
      //Use the ABI of a token at a particular address to call its methods
      let contract = this.web3.eth.contract(this.state.transferDetail.abi)
                          .at(this.state.transferDetail.address);  
      let transObj = {
      from: this.state.account,
      gas: this.state.defaultGasLimit,
      gasPrice: this.state.defaultGasPrice
      };  
      let app = this;  
      //Use the decimal places the token creator set to get actual amount of tokens to transfer
      let amount = this.state.fields.amount + 'e' + this.state.transferDetail.decimal;  
      let symbol = this.state.transferDetail.symbol;  
      let receiver = this.state.fields.receiver;  
  
  amount = new this.web3.BigNumber(amount).toNumber();  
  
  //Approve the token-zendr contract to spend on your behalf
  contract.approve(this.state.tzAddress, amount ,transObj, (err,response)=>{  
      if(!err) {  
          app.tokenZendr.deployed().then((instance) => {  
              this.tokenZendrInstance = instance;  
              this.watchEvents();  
              
              //Transfer the token to third party on user behalf
              this.tokenZendrInstance.transferTokens(symbol, receiver, amount, transObj)  
                 .then((response,err) => {  
                      if(response) { 
                          app.resetApp();  
                          
                          app.setState({  
                              tx: response.tx,  
                              inProgress: false  
                          });  
                     }else{  
                      console.log(err);  
                     } 
                 }); 
             }) 
         }else{  
          console.log(err);  
         } 
     }); 
 };  
 
 /**  
 * @dev Just a console log to list all transfers  
 */  
 watchEvents() {  
  let param = {from: this.state.account,to: this.state.fields.receiver,amount: this.state.fields.amount};  
  
  this.tokenZendrInstance.TransferSuccessful(param, {  
      fromBlock: 0,  
      toBlock: 'latest'  
  }).watch((error, event) => {  
      console.log(event);  
     }) 
 }  
 
  onInputChangeUpdateField = (name,value) => {  
      let fields = this.state.fields;  
  
      fields[name] = value;  
  
      this.setState({  
          fields  
      });  
 };  
 
  componentDidMount(){  
      let account = this.web3.eth.coinbase;  
      let app = this;  
      
      this.setNetwork();  
      this.setGasPrice();  
      this.setContractAddress();  
  
      this.setState({  
          account  
      });  
  
      //Loop through list of allowed tokens
      //using the token ABI & contract address
      //call the balanceOf method to see if this
      //address carries the token, then list on UI
      Tokens.forEach((token) => {  
          let contract = this.web3.eth.contract(token.abi);  
          let erc20Token = contract.at(token.address);  
      
      erc20Token.balanceOf(account,function (err,response) {  
          if(!err) {  
              let decimal = token.decimal;  
              let precision = '1e' + decimal;  
              let balance = response.c[0] / precision;  
              let name = token.name;  
              let symbol = token.symbol;  
              let icon = token.icon;  
              let abi = token.abi;  
              let address = token.address;  
      
              balance = balance >= 0 ? balance : 0;  
      
              let tokens = app.state.tokens;  
      
              if(balance > 0) tokens.push({  
                  decimal,  
                  balance,  
                  name,  
                  symbol,  
                  icon,  
                  abi,  
                  address,  
             });  
             
              app.setState({  
                  tokens  
              })  
            } 
         }); 
     }); 
 }  
 
  render() {  
      if(this.isWeb3) {  
          if(this.isWeb3Locked) {  
          return (  
             <div>  
                 <Nav appName={this.appName} network={this.state.network} />  
                 <UnlockMetamask message="Unlock Your Metamask/Mist Wallet" />  
             </div> 
         ) 
         }else {  
          return (  
             <div>  
                 <Nav appName={this.appName} network={this.state.network} />  
                 <Description />  
                 <Container onInputChangeUpdateField={this.onInputChangeUpdateField}  
                              transferDetail={this.state.transferDetail}  
                              closeTransfer={this.closeTransfer}  
                              newTransfer={this.newTransfer}  
                              Transfer={this.Transfer}  
                              account={this.state.account}  
                              defaultGasPrice={this.state.defaultGasPrice}  
                              defaultGasLimit={this.state.defaultGasLimit}  
                              tx={this.state.tx}  
                              inProgress={this.state.inProgress}  
                              fields={this.state.fields}  
                              tokens={this.state.tokens} />  
             </div>  
            ) 
        } 
    }else{  
         return(  
            <InstallMetamask />  
         ) 
        } 
     }
 }  
  
export default App;