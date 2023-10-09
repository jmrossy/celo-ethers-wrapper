const HelloWorldContract = {
  contractName: "HelloWorld",
  abi: [
    {
      constant: true,
      inputs: [],
      name: "getName",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "string",
          name: "newName",
          type: "string",
        },
      ],
      name: "setName",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  metadata:
    '{"compiler":{"version":"0.5.16+commit.9c3226ce"},"language":"Solidity","output":{"abi":[{"constant":true,"inputs":[],"name":"getName","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"newName","type":"string"}],"name":"setName","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}],"devdoc":{"methods":{}},"userdoc":{"methods":{}}},"settings":{"compilationTarget":{"project:/contracts/HelloWorld.sol":"HelloWorld"},"evmVersion":"istanbul","libraries":{},"optimizer":{"enabled":false,"runs":200},"remappings":[]},"sources":{"project:/contracts/HelloWorld.sol":{"keccak256":"0x8fad2ff358c9626a7561ece2e167393f3ebced924cbac25845ee91d1ff3e9ba3","urls":["bzz-raw://82d8a783cbd3930b300413af364fdb2fcf938fae887bbb5abaa5c7dd147643ac","dweb:/ipfs/QmNr85DekMVPxyjp5jfrywUxs4UgHhTUMjL9rYM6rh3DHs"]}},"version":1}',
  bytecode:
    "0x60806040526040518060400160405280600481526020017f43656c6f000000000000000000000000000000000000000000000000000000008152506000908051906020019061004f929190610062565b5034801561005c57600080fd5b50610107565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100a357805160ff19168380011785556100d1565b828001600101855582156100d1579182015b828111156100d05782518255916020019190600101906100b5565b5b5090506100de91906100e2565b5090565b61010491905b808211156101005760008160009055506001016100e8565b5090565b90565b6102c9806101166000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806317d7de7c1461003b578063c47f0027146100be575b600080fd5b610043610137565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610083578082015181840152602081019050610068565b50505050905090810190601f1680156100b05780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610135600480360360208110156100d457600080fd5b81019080803590602001906401000000008111156100f157600080fd5b82018360208201111561010357600080fd5b8035906020019184600183028401116401000000008311171561012557600080fd5b90919293919293905050506101d9565b005b606060008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156101cf5780601f106101a4576101008083540402835291602001916101cf565b820191906000526020600020905b8154815290600101906020018083116101b257829003601f168201915b5050505050905090565b8181600091906101ea9291906101ef565b505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061023057803560ff191683800117855561025e565b8280016001018555821561025e579182015b8281111561025d578235825591602001919060010190610242565b5b50905061026b919061026f565b5090565b61029191905b8082111561028d576000816000905550600101610275565b5090565b9056fea265627a7a723158205867faa743de0ad88e734dcac726e97112646dfff9353fee6350cbc1f339f93c64736f6c63430005100032",
  deployedBytecode:
    "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806317d7de7c1461003b578063c47f0027146100be575b600080fd5b610043610137565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610083578082015181840152602081019050610068565b50505050905090810190601f1680156100b05780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610135600480360360208110156100d457600080fd5b81019080803590602001906401000000008111156100f157600080fd5b82018360208201111561010357600080fd5b8035906020019184600183028401116401000000008311171561012557600080fd5b90919293919293905050506101d9565b005b606060008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156101cf5780601f106101a4576101008083540402835291602001916101cf565b820191906000526020600020905b8154815290600101906020018083116101b257829003601f168201915b5050505050905090565b8181600091906101ea9291906101ef565b505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061023057803560ff191683800117855561025e565b8280016001018555821561025e579182015b8281111561025d578235825591602001919060010190610242565b5b50905061026b919061026f565b5090565b61029191905b8082111561028d576000816000905550600101610275565b5090565b9056fea265627a7a723158205867faa743de0ad88e734dcac726e97112646dfff9353fee6350cbc1f339f93c64736f6c63430005100032",
  sourceMap:
    "195:970:0:-;;;280:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;195:970;8:9:-1;5:2;;;30:1;27;20:12;5:2;195:970:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;",
  deployedSourceMap:
    "195:970:0:-;;;;8:9:-1;5:2;;;30:1;27;20:12;5:2;195:970:0;;;;;;;;;;;;;;;;;;;;;;;;609:137;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;23:1:-1;8:100;33:3;30:1;27:10;8:100;;;99:1;94:3;90:11;84:18;80:1;75:3;71:11;64:39;52:2;49:1;45:10;40:15;;8:100;;;12:14;609:137:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1006:157;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;1006:157:0;;;;;;;;;;21:11:-1;8;5:28;2:2;;;46:1;43;36:12;2:2;1006:157:0;;35:9:-1;28:4;12:14;8:25;5:40;2:2;;;58:1;55;48:12;2:2;1006:157:0;;;;;;100:9:-1;95:1;81:12;77:20;67:8;63:35;60:50;39:11;25:12;22:29;11:107;8:2;;;131:1;128;121:12;8:2;1006:157:0;;;;;;;;;;;;:::i;:::-;;609:137;664:13;737:4;730:11;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;609:137;:::o;1006:157::-;1151:7;;1144:4;:14;;;;;;;:::i;:::-;;1006:157;;:::o;195:970::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o",
  source:
    "// Learn more about Solidity here: https://solidity.readthedocs.io\n\n// This statement specifies the compatible compiler versions\npragma solidity >=0.5.0;\n\n// Declare a contract called HelloWorld\ncontract HelloWorld {\n  \n  // Define a string called name, initialize it to 'Celo'\n  string name = 'Celo';\n\n  // Declares a function called getName\n  // The 'public' label means the function can be called internally, by transactions or other contracts\n  // The 'view' label indicates that the function does not change the state of the contract\n  // The function returns a string, from the memory data location  \n  function getName() \n    public \n    view \n    returns (string memory) \n  {\n    // Return the storage variable 'name'\n    return name;\n  }\n\n  // Declare a function called setName\n  // The function takes 1 parameter, a string, called newName, with the calldata data location in the Ethereum Virtual Machine  \n  // The 'external' label means the function can only be called from an external source\n  function setName(string calldata newName) \n    external \n  {\n    // Set the storage variable, name, to the value passed in as newName\n    name = newName;\n  }\n}",
  sourcePath:
    "/Users/josh/Documents/GitHub/celo-contracts-workshop/truffle/contracts/HelloWorld.sol",
  ast: {
    absolutePath: "project:/contracts/HelloWorld.sol",
    exportedSymbols: {
      HelloWorld: [23],
    },
    id: 24,
    nodeType: "SourceUnit",
    nodes: [
      {
        id: 1,
        literals: ["solidity", ">=", "0.5", ".0"],
        nodeType: "PragmaDirective",
        src: "129:24:0",
      },
      {
        baseContracts: [],
        contractDependencies: [],
        contractKind: "contract",
        documentation: null,
        fullyImplemented: true,
        id: 23,
        linearizedBaseContracts: [23],
        name: "HelloWorld",
        nodeType: "ContractDefinition",
        nodes: [
          {
            constant: false,
            id: 4,
            name: "name",
            nodeType: "VariableDeclaration",
            scope: 23,
            src: "280:20:0",
            stateVariable: true,
            storageLocation: "default",
            typeDescriptions: {
              typeIdentifier: "t_string_storage",
              typeString: "string",
            },
            typeName: {
              id: 2,
              name: "string",
              nodeType: "ElementaryTypeName",
              src: "280:6:0",
              typeDescriptions: {
                typeIdentifier: "t_string_storage_ptr",
                typeString: "string",
              },
            },
            value: {
              argumentTypes: null,
              hexValue: "43656c6f",
              id: 3,
              isConstant: false,
              isLValue: false,
              isPure: true,
              kind: "string",
              lValueRequested: false,
              nodeType: "Literal",
              src: "294:6:0",
              subdenomination: null,
              typeDescriptions: {
                typeIdentifier:
                  "t_stringliteral_9d2bc54cb1b449a4cf59411d04e3148a0ebb5ba960bffb680f6141d50a7be95c",
                typeString: 'literal_string "Celo"',
              },
              value: "Celo",
            },
            visibility: "internal",
          },
          {
            body: {
              id: 11,
              nodeType: "Block",
              src: "682:64:0",
              statements: [
                {
                  expression: {
                    argumentTypes: null,
                    id: 9,
                    name: "name",
                    nodeType: "Identifier",
                    overloadedDeclarations: [],
                    referencedDeclaration: 4,
                    src: "737:4:0",
                    typeDescriptions: {
                      typeIdentifier: "t_string_storage",
                      typeString: "string storage ref",
                    },
                  },
                  functionReturnParameters: 8,
                  id: 10,
                  nodeType: "Return",
                  src: "730:11:0",
                },
              ],
            },
            documentation: null,
            id: 12,
            implemented: true,
            kind: "function",
            modifiers: [],
            name: "getName",
            nodeType: "FunctionDefinition",
            parameters: {
              id: 5,
              nodeType: "ParameterList",
              parameters: [],
              src: "625:2:0",
            },
            returnParameters: {
              id: 8,
              nodeType: "ParameterList",
              parameters: [
                {
                  constant: false,
                  id: 7,
                  name: "",
                  nodeType: "VariableDeclaration",
                  scope: 12,
                  src: "664:13:0",
                  stateVariable: false,
                  storageLocation: "memory",
                  typeDescriptions: {
                    typeIdentifier: "t_string_memory_ptr",
                    typeString: "string",
                  },
                  typeName: {
                    id: 6,
                    name: "string",
                    nodeType: "ElementaryTypeName",
                    src: "664:6:0",
                    typeDescriptions: {
                      typeIdentifier: "t_string_storage_ptr",
                      typeString: "string",
                    },
                  },
                  value: null,
                  visibility: "internal",
                },
              ],
              src: "663:15:0",
            },
            scope: 23,
            src: "609:137:0",
            stateMutability: "view",
            superFunction: null,
            visibility: "public",
          },
          {
            body: {
              id: 21,
              nodeType: "Block",
              src: "1065:98:0",
              statements: [
                {
                  expression: {
                    argumentTypes: null,
                    id: 19,
                    isConstant: false,
                    isLValue: false,
                    isPure: false,
                    lValueRequested: false,
                    leftHandSide: {
                      argumentTypes: null,
                      id: 17,
                      name: "name",
                      nodeType: "Identifier",
                      overloadedDeclarations: [],
                      referencedDeclaration: 4,
                      src: "1144:4:0",
                      typeDescriptions: {
                        typeIdentifier: "t_string_storage",
                        typeString: "string storage ref",
                      },
                    },
                    nodeType: "Assignment",
                    operator: "=",
                    rightHandSide: {
                      argumentTypes: null,
                      id: 18,
                      name: "newName",
                      nodeType: "Identifier",
                      overloadedDeclarations: [],
                      referencedDeclaration: 14,
                      src: "1151:7:0",
                      typeDescriptions: {
                        typeIdentifier: "t_string_calldata_ptr",
                        typeString: "string calldata",
                      },
                    },
                    src: "1144:14:0",
                    typeDescriptions: {
                      typeIdentifier: "t_string_storage",
                      typeString: "string storage ref",
                    },
                  },
                  id: 20,
                  nodeType: "ExpressionStatement",
                  src: "1144:14:0",
                },
              ],
            },
            documentation: null,
            id: 22,
            implemented: true,
            kind: "function",
            modifiers: [],
            name: "setName",
            nodeType: "FunctionDefinition",
            parameters: {
              id: 15,
              nodeType: "ParameterList",
              parameters: [
                {
                  constant: false,
                  id: 14,
                  name: "newName",
                  nodeType: "VariableDeclaration",
                  scope: 22,
                  src: "1023:23:0",
                  stateVariable: false,
                  storageLocation: "calldata",
                  typeDescriptions: {
                    typeIdentifier: "t_string_calldata_ptr",
                    typeString: "string",
                  },
                  typeName: {
                    id: 13,
                    name: "string",
                    nodeType: "ElementaryTypeName",
                    src: "1023:6:0",
                    typeDescriptions: {
                      typeIdentifier: "t_string_storage_ptr",
                      typeString: "string",
                    },
                  },
                  value: null,
                  visibility: "internal",
                },
              ],
              src: "1022:25:0",
            },
            returnParameters: {
              id: 16,
              nodeType: "ParameterList",
              parameters: [],
              src: "1065:0:0",
            },
            scope: 23,
            src: "1006:157:0",
            stateMutability: "nonpayable",
            superFunction: null,
            visibility: "external",
          },
        ],
        scope: 24,
        src: "195:970:0",
      },
    ],
    src: "129:1036:0",
  },
  legacyAST: {
    attributes: {
      absolutePath: "project:/contracts/HelloWorld.sol",
      exportedSymbols: {
        HelloWorld: [23],
      },
    },
    children: [
      {
        attributes: {
          literals: ["solidity", ">=", "0.5", ".0"],
        },
        id: 1,
        name: "PragmaDirective",
        src: "129:24:0",
      },
      {
        attributes: {
          baseContracts: [null],
          contractDependencies: [null],
          contractKind: "contract",
          documentation: null,
          fullyImplemented: true,
          linearizedBaseContracts: [23],
          name: "HelloWorld",
          scope: 24,
        },
        children: [
          {
            attributes: {
              constant: false,
              name: "name",
              scope: 23,
              stateVariable: true,
              storageLocation: "default",
              type: "string",
              visibility: "internal",
            },
            children: [
              {
                attributes: {
                  name: "string",
                  type: "string",
                },
                id: 2,
                name: "ElementaryTypeName",
                src: "280:6:0",
              },
              {
                attributes: {
                  argumentTypes: null,
                  hexvalue: "43656c6f",
                  isConstant: false,
                  isLValue: false,
                  isPure: true,
                  lValueRequested: false,
                  subdenomination: null,
                  token: "string",
                  type: 'literal_string "Celo"',
                  value: "Celo",
                },
                id: 3,
                name: "Literal",
                src: "294:6:0",
              },
            ],
            id: 4,
            name: "VariableDeclaration",
            src: "280:20:0",
          },
          {
            attributes: {
              documentation: null,
              implemented: true,
              isConstructor: false,
              kind: "function",
              modifiers: [null],
              name: "getName",
              scope: 23,
              stateMutability: "view",
              superFunction: null,
              visibility: "public",
            },
            children: [
              {
                attributes: {
                  parameters: [null],
                },
                children: [],
                id: 5,
                name: "ParameterList",
                src: "625:2:0",
              },
              {
                children: [
                  {
                    attributes: {
                      constant: false,
                      name: "",
                      scope: 12,
                      stateVariable: false,
                      storageLocation: "memory",
                      type: "string",
                      value: null,
                      visibility: "internal",
                    },
                    children: [
                      {
                        attributes: {
                          name: "string",
                          type: "string",
                        },
                        id: 6,
                        name: "ElementaryTypeName",
                        src: "664:6:0",
                      },
                    ],
                    id: 7,
                    name: "VariableDeclaration",
                    src: "664:13:0",
                  },
                ],
                id: 8,
                name: "ParameterList",
                src: "663:15:0",
              },
              {
                children: [
                  {
                    attributes: {
                      functionReturnParameters: 8,
                    },
                    children: [
                      {
                        attributes: {
                          argumentTypes: null,
                          overloadedDeclarations: [null],
                          referencedDeclaration: 4,
                          type: "string storage ref",
                          value: "name",
                        },
                        id: 9,
                        name: "Identifier",
                        src: "737:4:0",
                      },
                    ],
                    id: 10,
                    name: "Return",
                    src: "730:11:0",
                  },
                ],
                id: 11,
                name: "Block",
                src: "682:64:0",
              },
            ],
            id: 12,
            name: "FunctionDefinition",
            src: "609:137:0",
          },
          {
            attributes: {
              documentation: null,
              implemented: true,
              isConstructor: false,
              kind: "function",
              modifiers: [null],
              name: "setName",
              scope: 23,
              stateMutability: "nonpayable",
              superFunction: null,
              visibility: "external",
            },
            children: [
              {
                children: [
                  {
                    attributes: {
                      constant: false,
                      name: "newName",
                      scope: 22,
                      stateVariable: false,
                      storageLocation: "calldata",
                      type: "string",
                      value: null,
                      visibility: "internal",
                    },
                    children: [
                      {
                        attributes: {
                          name: "string",
                          type: "string",
                        },
                        id: 13,
                        name: "ElementaryTypeName",
                        src: "1023:6:0",
                      },
                    ],
                    id: 14,
                    name: "VariableDeclaration",
                    src: "1023:23:0",
                  },
                ],
                id: 15,
                name: "ParameterList",
                src: "1022:25:0",
              },
              {
                attributes: {
                  parameters: [null],
                },
                children: [],
                id: 16,
                name: "ParameterList",
                src: "1065:0:0",
              },
              {
                children: [
                  {
                    children: [
                      {
                        attributes: {
                          argumentTypes: null,
                          isConstant: false,
                          isLValue: false,
                          isPure: false,
                          lValueRequested: false,
                          operator: "=",
                          type: "string storage ref",
                        },
                        children: [
                          {
                            attributes: {
                              argumentTypes: null,
                              overloadedDeclarations: [null],
                              referencedDeclaration: 4,
                              type: "string storage ref",
                              value: "name",
                            },
                            id: 17,
                            name: "Identifier",
                            src: "1144:4:0",
                          },
                          {
                            attributes: {
                              argumentTypes: null,
                              overloadedDeclarations: [null],
                              referencedDeclaration: 14,
                              type: "string calldata",
                              value: "newName",
                            },
                            id: 18,
                            name: "Identifier",
                            src: "1151:7:0",
                          },
                        ],
                        id: 19,
                        name: "Assignment",
                        src: "1144:14:0",
                      },
                    ],
                    id: 20,
                    name: "ExpressionStatement",
                    src: "1144:14:0",
                  },
                ],
                id: 21,
                name: "Block",
                src: "1065:98:0",
              },
            ],
            id: 22,
            name: "FunctionDefinition",
            src: "1006:157:0",
          },
        ],
        id: 23,
        name: "ContractDefinition",
        src: "195:970:0",
      },
    ],
    id: 24,
    name: "SourceUnit",
    src: "129:1036:0",
  },
  compiler: {
    name: "solc",
    version: "0.5.16+commit.9c3226ce.Emscripten.clang",
  },
  networks: {
    "44787": {
      events: {},
      links: {},
      address: "0x4E87943C9BF939fB2A2520b35a3ae2056dF43199",
      transactionHash:
        "0x0e2d3d71d9cd671fc435e3592030f72e1a0c06b01021f2ad08ec30f0ec9c0be2",
    },
  },
  schemaVersion: "3.4.6",
  updatedAt: "2022-05-12T14:29:26.541Z",
  networkType: "ethereum",
  devdoc: {
    methods: {},
  },
  userdoc: {
    methods: {},
  },
} as const;
export default HelloWorldContract;
