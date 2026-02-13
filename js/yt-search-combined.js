const APP_VERSION = "26-02-13-02";
console.log(`📦 MyApp version: ${APP_VERSION}`);

// Function to format date
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Define your Azure AI Search endpoint
const endpoint = 'https://youtube-search.search.windows.net/indexes/youtube-combined-search-v2/docs/search?api-version=2021-04-30-Preview';
const querykey = 'nkFW7TTMiWpgBAda2J5PoTxOuzj5C6IN2g0vl7na3xAzSeDJJ4rc';

// Function to run search
async function runSearch() {
    const raw = document.getElementById('query').value.trim();
    if (!raw) {
        document.getElementById('results').innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    document.getElementById('results').innerHTML = "Loading...";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'api-key': querykey
            },
            body: JSON.stringify({
                search: raw,
                searchFields: "channel_title,description",
                filter: "is_video eq true",
                queryType: "full",
                top: 50,
                count: true
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const data = await res.json();
        console.log(data); // Log to inspect the structure

        const itemCount = data.value ? data.value.length : 0;
        const countDisplay = `<div class="count">${data["@odata.count"] !== undefined ? data["@odata.count"] : itemCount} results found</div>`;

        if (!data.value || data.value.length === 0) {
            document.getElementById('results').innerHTML = "<p>No results found.</p>";
            return;
        }

        const cards = `<div class="results">` + data.value.map(item => `
            <div class="card">
                <img src="${item.thumbnail_url || ''}" alt="" style="max-width: 200px; max-height: 150px;">
                <div class="title">${item.title || 'No title'}</div>
                <div>${item.channel_title || ''}</div>
                <div class="meta">
                    <span>📅 ${item.published_at ? formatDate(item.published_at) : 'Unknown date'}</span>
                    <span>⏱ ${item.duration_formatted || 'Unknown duration'}</span>
                </div>
                <a class="watch-link" href="${item.url}" target="_blank">▶ Watch</a>
            </div>
        `).join('') + `</div>`;

        document.getElementById('results').innerHTML = countDisplay + cards;

    } catch (err) {
        document.getElementById('results').innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
}

async function runChannelSearch() {
    const rawChannelQuery = document.getElementById('channelQuery').value.trim();
    if (!rawChannelQuery) {
        document.getElementById('results').innerHTML = "<p>Please enter a channel search term.</p>";
        return;
    }

    document.getElementById('results').innerHTML = "Loading...";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'api-key': querykey
            },
            body: JSON.stringify({
                search: rawChannelQuery,
                searchFields: "channel_title,description",
                filter: "is_channel eq true",
                queryType: "full",
                top: 50,
                count: true
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const data = await res.json();
        console.log(data); // Log to inspect the response structure

        const itemCount = data.value ? data.value.length : 0;
        const countDisplay = `<div class="count">${data["@odata.count"] !== undefined ? data["@odata.count"] : itemCount} results found</div>`;

        if (!data.value || data.value.length === 0) {
            document.getElementById('results').innerHTML = "<p>No results found.</p>";
            return;
        }

        const cards = `<div class="results">` + data.value.map(item => `
            <div class="card">
                <img src="${item.thumbnail_url || ''}" alt="" style="max-width: 200px; max-height: 150px;">
                <div class="title">${item.title || 'No title'}</div>
                <div>${item.channel_title || ''}</div>
                <div class="meta">
                    <span>📅 ${item.published_at ? formatDate(item.published_at) : 'Unknown date'}</span>
                    <span>⏱ ${item.duration_formatted || 'Unknown duration'}</span>
                </div>
                <a class="watch-link" href="${item.url}" target="_blank">▶ Watch</a>
            </div>
        `).join('') + `</div>`;

        document.getElementById('results').innerHTML = countDisplay + cards;

    } catch (err) {
        document.getElementById('results').innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
}


// Add event listener for Enter key press
document.getElementById('query').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    runSearch();
  }
});


// Add event listener for Enter key press
document.getElementById('channelQuery').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        runChannelSearch();
    }
});
