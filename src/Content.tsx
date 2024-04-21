import {Button, Placeholder} from "@xelene/tgui";
import {useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {generatePayload, getAddressAndStateInit} from "./nft.ts";

export const Content = () => {
    const wallet = useTonWallet();
    const [tc] = useTonConnectUI();
    const onSend = () => {
        if (!wallet) {
            return tc.openModal();
        }

        const payload = generatePayload(wallet!.account.address);
        const { address, stateInit } = getAddressAndStateInit(wallet!.account.address);

        tc.sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
            messages: [{
                address,
                amount: '100000000',
                payload,
                stateInit
            }]
        })
    }
    return <Placeholder
    >
        <img
            alt="Scanner"
            src="https://raw.githubusercontent.com/mir-one/sbt-scanner/main/public/scanner.gif"
            style={{ display: 'block', width: '144px', height: '144px' }}
        />
        <Button onClick={onSend}>Mint NFT Scanner</Button>
    </Placeholder>
}