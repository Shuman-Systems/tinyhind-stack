import { TinyHindClient } from '../../tinylib/tinyhind-client.ts';
import { TENANT_ID } from '../../config.ts';
import { DbSchema } from '../../tinylib/api-types.ts';

const appRoot = document.getElementById('app-root') as HTMLDivElement;
const tiny = new TinyHindClient('', TENANT_ID);

async function initialize() {
    appRoot.innerHTML = '<h2>Registering "Items" table...</h2>';
    try {


        const newItem: Partial<DbSchema['Items']> = {
                    Name:"bruh",
                    
        }

    } catch (error: any) {
        appRoot.innerHTML = `<h2>Error registering table</h2><pre>${error.message}</pre>`;
        console.error(error);
    }
}

initialize();