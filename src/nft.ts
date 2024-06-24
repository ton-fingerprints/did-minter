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
  "b5ee9c7241020d010001d0000114ff00f4a413f4bcf2c80b0102016202030202ce04050009a11f9fe00502012006070201200b0c02d70c8871c02497c0f83434c0c05c6c2497c0f83e903e900c7e800c5c75c87e800c7e800c3c00812ce3850c1b088d148cb1c17cb865407e90350c0408fc00f801b4c7f4cfe08417f30f45148c2ea3a1cc840dd78c9004f80c0d0d0d4d60840bf2c9a884aeb8c097c12103fcbc20080900113e910c1c2ebcb8536001f65135c705f2e191fa4021f001fa40d20031fa00820afaf0801ba121945315a0a1de22d70b01c300209206a19136e220c2fff2e192218e3e821005138d91c85009cf16500bcf16712449145446a0708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb00104794102a375be20a00727082108b77173505c8cbff5004cf1610248040708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb000082028e3526f0018210d53276db103744006d71708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb0093303234e25502f003003b3b513434cffe900835d27080269fc07e90350c04090408f80c1c165b5b60001d00f232cfd633c58073c5b3327b5520bf75041b";
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
