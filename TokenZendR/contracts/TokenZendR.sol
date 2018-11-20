pragma solidity ^0.4.23;  
  
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";  
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";  
  
contract TokenZendR is Ownable, Pausable {
        /**  
    * @dev Details of each transfer  
    * @param contract_ contract address of ER20 token to transfer  
    * @param to_ receiving account  
    * @param amount_ number of tokens to transfer to_ account  
    * @param failed_ if transfer was successful or not  
    */  
    struct Transfer {  
        address contract_;  
        address to_;  
        uint amount_;  
        bool failed_;  
    }
        /**  
    * @dev a mapping from transaction ID's to the sender address  
    * that initiates them. Owners can create several transactions  
    */  
    mapping(address => uint[]) public transactionIndexesToSender;
    /**  
    * @dev a list of all transfers successful or unsuccessful  
    */  
    Transfer[] public transactions;
}