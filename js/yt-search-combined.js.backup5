const APP_VERSION = "26-02-11-06";
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

// Quoted phrases are preserved. Unquoted words each get a "+" prefix.
// Example: guitar "blues lesson" → +guitar +"blues lesson"
function buildAndQuery(raw) {
    const tokens = [];
    const regex = /"[^"]*"|\S+/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
        let token = match[0];
        // Don't double-prefix if user already typed + or -
        if (!token.startsWith('+') && !token.startsWith('-')) {
            token = '+' + token;
        }
        tokens.push(token);
    }
    return tokens.join(' ');
}

// Define your Azure AI Search endpoint
const endpoint = 'https://youtube-search.search.windows.net/indexes/youtube-combined-search/docs/search?api-version=2021-04-30-Preview';
const querykey = 'nkFW7TTMiWpgBAda2J5PoTxOuzj5C6IN2g0vl7na3xAzSeDJJ4rc';

// Function to run search
async function runSearch() {
    const raw = document.getElementById('query').value.trim();
    if (!raw) {
        document.getElementById('results').innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    const q = buildAndQuery(raw);
    document.getElementById('results').innerHTML = "Loading...";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'api-key': querykey
            },
            body: JSON.stringify({ search: q })
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

    const channelSearchQuery = `channel_title:${rawChannelQuery}`;
    document.getElementById('results').innerHTML = "Loading...";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'api-key': querykey
            },
            body: JSON.stringify({ search: channelSearchQuery })
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
