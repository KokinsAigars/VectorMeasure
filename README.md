/**
* Project Name: “VectorMeasure”
* License: MIT
* Contributor(s): Aigars Kokins, ChatGPT-5
* 2025.06.03 - init(1)
* 2025.08.08 - init(2)
* 2025.08.15 - init(3) V0.0.8
* 
* The purpose of this project is to test pdf.js functionality
* https://github.com/mozilla/pdf.js
*
*/


DEVELOPMENT

Download && install Node.js ^v22.18.0(LTS)
https://nodejs.org/en/download
    > node -v
    v22.18.0
    
    npm install
    
    npm run dev
    http://localhost:3000/
    

For Testing
    npx playwright install

for Avast users
    Access Firewall Settings: Go to Menu > Settings > Protection > Firewall > View Firewall rules.
    Manage Network Rules: Click on "Network rules"
    Add a New Rule:
        name: "node.js_test" && Protocol: "TCP"" && Address: "127.0.0.1" && Local Port: "63315" && Action: "Allow"

or in cmd: > set NODE_OPTIONS=--dns-result-order=ipv4first

    npm test
    npm run test:watch
    npx vitest --project=browser

    npm run coverage

