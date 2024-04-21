import {AppRoot} from "@xelene/tgui";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import {Header} from "./Header.tsx";
import {Content} from "./Content.tsx";

function App() {
    return <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/mir-one/sbt-scanner/main/public/tonconnect-manifest.json">
        <AppRoot>
            <Header />
        <Content />
    </AppRoot>
    </TonConnectUIProvider>
}
export default App
