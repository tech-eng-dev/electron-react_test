export {}
//mockup for jest
(window as any).require = (moduleName: string) => {
    switch (moduleName) {
        case 'electron':
            return {
                remote: {
                    require: (m: string) => {
                        switch (m) {
                            case './context':
                                return {
                                    getAppSettings: () => ({ 'common.host': 'www.mock.com', 'common.port': 0 }),
                                    getInjectScriptFolderPath: () => 'demo'
                                }
                            default:
                                break;
                        }
                    }
                }
            }

        default:
            break;
    }
}