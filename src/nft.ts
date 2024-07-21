import { Base64 } from "@tonconnect/protocol";
import {
  Address,
  beginCell,
  contractAddress as calculateContractAddress,
  Cell,
  storeStateInit,
} from "ton";

const nftUri =
  "https://raw.githubusercontent.com/ton-fingerprints/did-minter/main/public/nft.json";

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
  "b5ee9c724102130100033b000114ff00f4a413f4bcf2c80b0102016207020201200403001dbc7e7f8017c217c20fc21fc227c2340201580605000db7b07e005f08f0000db5631e005f08b00202ce0b080201200a0900373e11fe11be107232cffe10f3c5be1133c5b33e1173c5b2cff27b552000613b513434cfc07e187e90007e18dc3e188835d2708023859ffe18be90007e1935007e19be90007e1974cfcc3e19e44c38a004bd46c2220c700915be001d0d303fa4030f002f842b38e1c31f84301c705f2e195fa4001f864d401f866fa4030f86570f867f003e002d31f0271b0e30201d33f8210d0c3bfea5230bae302821004ded1485230bae3023082102fcb26a25220ba81211100c03fa8e4031f841c8cbfff843cf1680107082108b7717354015504403804003c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb00e082101f04537a5220bae30282106f89f5e35220ba8e165bf84501c705f2e191f847c000f2e193f823f867f003e08210d136d3b35220bae30230310f0e0d002082105fcc3d14ba93f2c19dde840ff2f0008e31f84422c705f2e191820afaf08070fb028010708210d53276db102455026d830603c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb00009231f84422c705f2e1918010708210d53276db102455026d830603c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb008b02f8648b02f865f00300c632f8445003c705f2e191fa40d4d30030f847f841c8cbfff844cf1613cc12cb3f5210cb0001c30094f84601ccde801078b17082100524c7ae405503804003c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb0000c26c12fa40d4d30030f847f841c8cbff5006cf16f844cf1612cc14cb3f5230cb0003c30096f8465003cc02de801078b17082100dd607e3403514804003c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb0000943031d31f82100524c7ae12ba8e39d33f308010f844708210c18e86d255036d804003c8cb1f12cb3f216eb39301cf179131e2c97105c8cb055004cf1658fa0213cb6accc901fb009130e280f3bdcd";
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
