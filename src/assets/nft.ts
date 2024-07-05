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
  "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu";
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
