import { App } from "./app";
import { cache } from "./cache";
import { disposeLogger } from "./winston";

declare const module: any;
const app = new App();
app.listen();
// You need only 3 lines of code to start accepting code changes coming through the HMR
if (module.hot) {
    module.hot.accept();
    // Next callback is essential: After code changes were accepted
    // we need to restart the app. server.close() is here Express.JS-specific and can differ in other frameworks.
    // The idea is that you should shut down your app here. Data/state saving between shutdown and new start is possible
    module.hot.dispose(() => {
        // console.log(logger);
        if (app.server) {
            app.server.close();
        }
        disposeLogger();
        cache.clear();
    });
}
