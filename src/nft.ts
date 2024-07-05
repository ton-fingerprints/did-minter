import { Base64 } from "@tonconnect/protocol";
import {
  Address,
  beginCell,
  contractAddress as calculateContractAddress,
  Cell,
  storeStateInit,
} from "ton";

const nftUri =
  "https://raw.githubusercontent.com/mir-one/sbt-scanner/main/public/nft.json";

function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }
  return chunks;
}

function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127);

  if (chunks.length === 0) {
    return beginCell().endCell();
  }

  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell();
  }

  let curCell = beginCell();

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];

    curCell.storeBuffer(chunk);

    if (i - 1 >= 0) {
      const nextCell = beginCell();
      nextCell.storeRef(curCell);
      curCell = nextCell;
    }
  }

  return curCell.endCell();
}

const contractCode =
  "b5ee9c7201022901000750000114ff00f4a413f4bcf2c80b010201620203039ad001d0d3030171b0a301fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088545053036f04f86102f862db3c5517db3cf2e082c8f84301cc7f01ca005570db3cc9ed54240405020120151604ee0192307fe07021d749c21f953020d70b1fde20821089d97e85ba8f1730d31f01821089d97e85baf2e081db3c06fa0050776c17e020821004ded148ba8eb730d31f01821004ded148baf2e081d33ffa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801d4d20055306c14e0200607080901f6508720d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf165005206e95307001cb018e1e20d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf16e2500320d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf1601c8cbff12cc12cb1f13cb1fca00c9011400aefa00fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801d4d31f20d70b01c3008e1ffa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e0889472d7216de201fa0055500366365b353681114df8425290c705f2f422b320953338277f03de0270fb0270810082038e81888e8188e241307f55306d6ddb3c7f0a0b12039670804053ac206ef2d08023058e845577db3c8e12c8c908111008107f106e105d104c103b4a90e205111005104a10394ed0c85550db3cc9103a47607f55306d6ddb3c10671036405503047f100c1203c48210d0c3bfeaba8eb730d31f018210d0c3bfeabaf2e081d33ffa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801d4d20055306c14e02082105fcc3d14ba8e8b30db3c6c165f06f2c1937fe082102fcb26a2bae30230700d0e0f002e0000000053636f7265206d696e74656420e298afefb88f00300000000053636f7265207570646174656420e298afefb88f008282100524c7ae5007cb1f15cb3f13cbff0120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf16cccb3f216eb3957f01ca00cc947032ca00e203b87080402af8422e206ef2d08024068e9007111007106f105e104d103c4ba9db3c8e14c8c90811110807111007106f105e104d103c4ba0e21069105c104b103a021110021fc85560db3cc9103b48707f55306d6ddb3c10475e2340347f10111200c0d31f0182105fcc3d14baf2e081d33ffa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801d2000191d4926d01e2fa0051551514433001b0d31f0182102fcb26a2baf2e081d33f0131f84270804054338bc8552082108b7717355004cb1f12cb3f810101cf000120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf16c941307f55306d6ddb3c7f12000a21c8cb1fc900c082100dd607e35008cb1f16cb3f14cbff5820d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf160120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf16cccb3f216eb3957f01ca00cc947032ca00e201cac87101ca01500701ca007001ca02500520d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e088cf165003fa027001ca68236eb3917f93246eb3e2973333017001ca00e30d216eb39c7f01ca0001206ef2d08001cc95317001ca00e2c901fb001300987f01ca00c87001ca007001ca00246eb39d7f01ca0004206ef2d0805004cc9634037001ca00e2246eb39d7f01ca0004206ef2d0805004cc9634037001ca00e27001ca00027f01ca0002c958cc0002cc02015817180201201b1c0211b5631b679b678d903024190211b7b07b679b678d9030241a0006c8c9d00002700201201d1e02014820210211b5f9fb679b678d90b0241f00b9b77a304e0b9d87aba595cf63d09d873ac950a36cd04e13bac6a5a56c8f96645a75e5bfbe2c47304e040ab803700cec7299cb0755c8e4b658704e037a93bdf2a8b2de38ea7a7bc0ab3864d04e13b2e9cb5669d96e6741d2cdb28cdd1490001826206ef2d080546160546a710011b0afbb51343480006002012022230211ae1c6d9e6d9e3640c024250075acddc686ad2e0cce6745e5ea2daa46a98a682dcc86c6ec4e698909ab2a862b0c6c2cee0f29ac67262ecceee62d2ea6ee0cee68a866e686eec8d040028eed44d0d401f863d200018e84db3c6c18e0f828d70b0a8309baf2e089fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801810101d7005902d101db3c262700022101f6fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e0880120d70b01c3008e1ffa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e0889472d7216de201fa400120d74981010bbaf2e08820d70b0a208104ffbaf2d0898309baf2e08801d401d0d3ffd4d31fd31fd2003028001c6d702070f842c8c9503305064414000c105810571056";
const initCodeCell = Cell.fromBase64(contractCode);

const createOffchainUriCell = (uri: string) => {
  let data = Buffer.from(uri);
  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);

  return makeSnakeCell(data);
};

function generateInitialData(ownerAddressHex: string): Cell {
  const nftContent = createOffchainUriCell(nftUri);

  const builder = beginCell()
    .storeUint(0, 64)
    .storeUint(0, 2)
    .storeAddress(Address.parseRaw(ownerAddressHex))
    .storeUint(Date.now(), 64)
    .storeRef(nftContent);

  return builder.endCell();
}

function generateStateInit(data: Cell): string {
  return callToBase64(
    beginCell()
      .store(storeStateInit({ code: initCodeCell, data }))
      .endCell()
  );
}

function callToBase64(cell: Cell): string {
  return Base64.encode(cell.toBoc());
}

function generateContractAddress(initDataCell: Cell): string {
  return calculateContractAddress(0, {
    data: initDataCell,
    code: initCodeCell,
  }).toString();
}

export function getAddressAndStateInit(ownerAddress: string): {
  address: string;
  stateInit: string;
} {
  const initialData = generateInitialData(ownerAddress);
  const address = generateContractAddress(initialData);
  const stateInit = generateStateInit(initialData);
  return { address, stateInit };
}

export function generatePayload(sendTo: string): string {
  const op = 0x5fcc3d14; // transfer
  const quiryId = 0;
  const messageBody = beginCell()
    .storeUint(op, 32)
    .storeUint(quiryId, 64)
    .storeAddress(Address.parse(sendTo))
    .storeAddress(Address.parse(sendTo))
    .storeBit(false)
    .storeCoins(0)
    .storeBit(0)
    .endCell();

  return Base64.encode(messageBody.toBoc());
}

export function getRawAddress(userFriendlyAddress: string): string {
  return Address.parse(userFriendlyAddress).toString();
}
