const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const baseUrl = 'https://www.mystore411.com';
    const mainUrl = `${baseUrl}/store/list_state/28/Georgia/Burger-King-store-locations`;
    const outputFile = 'BurgerKingLocations.txt';
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Visit the main page to get the list of cities
    await page.goto(mainUrl, { timeout: 120000 });
    await page.waitForSelector('table.table1');

    const cityLinks = await page.$$eval('table.table1 tbody tr td a', anchors => 
        anchors.map(anchor => ({ 
            city: anchor.innerText.trim(), 
            link: anchor.href 
        }))
    );

    let results = '';

    for (const { city, link } of cityLinks) {
        results += `\n${city}\n`;
        console.log(`Scraping data for city: ${city}`);

        try {
            await page.goto(link, { timeout: 120000 });
            await page.waitForSelector('table.table1');

            const cityData = await page.$$eval('table.table1 tbody tr', rows => {
                return rows.map(row => {
                    const nameCell = row.querySelector('td:nth-child(1) a');
                    const phoneCell = row.querySelector('td:nth-child(3)');

                    if (nameCell && phoneCell) {
                        return `${nameCell.innerText.trim()}\t${phoneCell.innerText.trim()}`;
                    }
                    return null;
                }).filter(data => data);
            });

            const cityResult = cityData.join('\n');
            results += cityResult + '\n';

            // Log the data for the current city
            console.log(cityResult);
        } catch (error) {
            console.error(`Failed to scrape data for city: ${city}`, error);
        }
    }

    await browser.close();

    // Save the results to a notepad file
    fs.writeFileSync(outputFile, results, 'utf8');
    console.log(`Data saved to ${outputFile}`);
})();
