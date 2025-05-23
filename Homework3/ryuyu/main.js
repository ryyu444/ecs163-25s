// drag functions for plots
function dragstarted(event) {
  const div = d3.select(this);
  const rect = this.getBoundingClientRect();

  // Calculate the offset from the current position
  const offsetX = event.x - rect.left;
  const offsetY = event.y - rect.top;

  // Store current transform values
  const transform = div.style('transform');
  div
    .attr('data-initial-transform', transform)
    .style('transform', 'none')
    .style('left', rect.left + 'px')
    .style('top', rect.top + 'px')
    .attr('data-offset-x', offsetX)
    .attr('data-offset-y', offsetY);
}

function dragged(event) {
  const div = d3.select(this);

  // Check if drag was initialized
  if (!div.attr('data-offset-x')) return;

  const offsetX = +div.attr('data-offset-x');
  const offsetY = +div.attr('data-offset-y');

  div
    .style('left', event.x - offsetX + 'px')
    .style('top', event.y - offsetY + 'px');
}

// load the Pokemon data
d3.csv('./data/pokemon.csv')
  .then((data) => {
    // convert csv data to json
    const processedData = data.map((d) => ({
      id: +d.Number,
      name: d.Name,
      type1: d.Type_1,
      type2: d.Type_2,
      total: +d.Total,
      hp: +d.HP,
      attack: +d.Attack,
      defense: +d.Defense,
      spAtk: +d.Sp_Atk,
      spDef: +d.Sp_Def,
      speed: +d.Speed,
      generation: +d.Generation,
      legendary: d.isLegendary === 'True',
    }));

    // create Pokemon card divs
    const cards = d3
      .select('#pokemon-grid')
      .selectAll('.pokemon-card')
      .data(processedData)
      .join('div')
      .attr('class', 'pokemon-card')
      .on('click', showPokemonDetails);

    // add pokemon name to cards
    cards.append('h3').text((d) => d.name);

    // add pokemon sprites to card from PokeAPI
    cards
      .append('img')
      .attr(
        'src',
        (d) =>
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`
      )
      .attr('alt', (d) => d.name);

    cards
      .append('p')
      .text((d) => `Type: ${d.type1}${d.type2 ? '/' + d.type2 : ''}`);

    // create card modal + close button
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementsByClassName('close')[0];

    // hide modal when close button is clicked
    closeBtn.onclick = function () {
      modal.style.display = 'none';
      // remove all visual plots when closing the modal
      d3.selectAll('.stats-div').remove();
      d3.selectAll('.evolution-div').remove();
      d3.selectAll('.compare-div').remove();
    };

    // hide modal when clicking outside of modal
    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
        // remove all visual plots when closing the modal
        d3.selectAll('.stats-div').remove();
        d3.selectAll('.evolution-div').remove();
        d3.selectAll('.compare-div').remove();
      }
    };

    // show pokemon details when card is clicked
    function showPokemonDetails(event, d) {
      const modal = document.getElementById('modal');
      const detailsDiv = document.getElementById('pokemon-details');

      // Clear previous content
      detailsDiv.innerHTML = '';

      // Create details content
      const content = d3.select('#pokemon-details');

      // add pokemon name to details div
      content.append('h2').text(d.name);

      // add pokemon sprite to details div
      content
        .append('img')
        .attr(
          'src',
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`
        )
        .attr('alt', d.name)
        .style('width', '200px')
        .style('height', '200px')
        .style('display', 'block')
        .style('margin', '0 auto');

      // add typing, generation, & legendary status to details
      content.append('p').html(`<strong>Types:</strong> ${d.type1}${
        d.type2 ? '/' + d.type2 : ''
      }<br>
               <strong>Generation:</strong> ${d.generation}<br>
               <strong>Legendary:</strong> ${d.legendary ? 'Yes' : 'No'}`);

      // Create buttons container
      const buttonsContainer = content
        .append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '10px');

      // Create stats button + show stats when clicked (Bar Chart)
      buttonsContainer
        .append('button')
        .attr('class', 'stats-button')
        .text('Show Stats')
        .on('click', function () {
          // Check if stats div already exists so it doesn't reopen
          if (d3.select('.stats-div').empty()) {
            showStats();
          }
        });

      // Create evolution + show evolution tree when clicked (Dendrogram)
      buttonsContainer
        .append('button')
        .attr('class', 'evolution-button')
        .text('Show Evolution')
        .on('click', () => {
          // Check if evolution div already exists so it doesn't reopen
          if (d3.select('.evolution-div').empty()) {
            showEvolution(d);
          }
        });

      // Create compare button + show Base Stat Total (BST) comparison when clicked (Scatter Plot)
      buttonsContainer
        .append('button')
        .attr('class', 'compare-button')
        .text('Compare Pokémon')
        .on('click', () => {
          // Check if compare div already exists so it doesn't reopen
          if (d3.select('.compare-div').empty()) {
            showComparison(d, processedData);
          }
        });

      // show stats when stats button is clicked
      function showStats() {
        // Remove any existing stats div
        d3.selectAll('.stats-div').remove();

        // filter out stats from csv data
        const stats = [
          { name: 'HP', value: d.hp },
          { name: 'Attack', value: d.attack },
          { name: 'Defense', value: d.defense },
          { name: 'Sp. Attack', value: d.spAtk },
          { name: 'Sp. Defense', value: d.spDef },
          { name: 'Speed', value: d.speed },
        ];

        // Create new stats div
        const newStatsDiv = d3
          .select('body')
          .append('div')
          .attr('class', 'stats-div')
          .style('left', '50%')
          .style('top', '50%')
          .style('transform', 'translate(-50%, -50%)');

        // Add close button with immediate removal
        newStatsDiv
          .append('button')
          .attr('class', 'stats-close')
          .html('&times;')
          .on('click', function (event) {
            event.stopPropagation(); // Prevent event bubbling
            const div = d3.select(this.parentNode);
            div.remove(); // Remove immediately without transition
          });

        // Add draggable header
        newStatsDiv
          .append('div')
          .attr('class', 'stats-header')
          .text(`${d.name}'s Stats`);

        // Create SVG for bar chart
        const margin = { top: 20, right: 20, bottom: 30, left: 90 };
        const width = 400 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = newStatsDiv
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const x = d3.scaleLinear().domain([0, 255]).range([0, width]);

        const y = d3
          .scaleBand()
          .domain(stats.map((d) => d.name))
          .range([0, height])
          .padding(0.1);

        // Add X axis
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        // Add Y axis
        svg.append('g').call(d3.axisLeft(y));

        // Add bars with transition - darkens bars when hovered over
        svg
          .selectAll('rect')
          .data(stats)
          .join('rect')
          .attr('y', (d) => y(d.name))
          .attr('height', y.bandwidth())
          .attr('x', 0)
          .attr('width', 0)
          .transition()
          .duration(1000)
          .attr('width', (d) => x(d.value))
          .attr('fill', '#3498db');

        // Add value labels
        svg
          .selectAll('.value-label')
          .data(stats)
          .join('text')
          .attr('class', 'value-label')
          .attr('x', (d) => x(d.value) + 5)
          .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
          .attr('dy', '0.35em')
          .text((d) => d.value)
          .style('opacity', 0)
          .transition()
          .duration(1000)
          .style('opacity', 1);

        // Make the div draggable
        const drag = d3.drag().on('start', dragstarted).on('drag', dragged);

        newStatsDiv.call(drag);

        // Show the stats div with transition
        setTimeout(() => {
          newStatsDiv
            .classed('active', true)
            .style('transform', 'translate(-50%, -50%) scale(1)');
        }, 50);
      }

      // show evolution tree when evolution button is clicked
      // fetches evolution chain data from PokeAPI
      async function showEvolution(pokemon) {
        // Remove any existing evolution div
        d3.selectAll('.evolution-div').remove();

        try {
          // Fetch Pokemon species data to get evolution chain URL
          const speciesResponse = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`
          );
          const speciesData = await speciesResponse.json();

          // Fetch evolution chain data
          const evolutionResponse = await fetch(
            speciesData.evolution_chain.url
          );
          const evolutionData = await evolutionResponse.json();

          // Process evolution chain into hierarchical structure
          const hierarchicalData = processEvolutionChain(evolutionData.chain);

          // Create new evolution div
          const evolutionDiv = d3
            .select('body')
            .append('div')
            .attr('class', 'evolution-div')
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%, -50%)');

          // Add close button with immediate removal
          evolutionDiv
            .append('button')
            .attr('class', 'stats-close')
            .html('&times;')
            .on('click', function (event) {
              event.stopPropagation(); // Prevent event bubbling
              const div = d3.select(this.parentNode);
              div.remove(); // Remove immediately without transition
            });

          // Add draggable header
          evolutionDiv
            .append('div')
            .attr('class', 'stats-header')
            .text('Evolution Chain');

          // Create SVG for dendrogram
          const margin = { top: 20, right: 90, bottom: 30, left: 90 };
          const width = 600 - margin.left - margin.right;
          const height = 400 - margin.top - margin.bottom;

          const svg = evolutionDiv
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

          // Create dendrogram layout
          const treeLayout = d3.tree().size([height, width]);
          const root = d3.hierarchy(hierarchicalData);
          const treeData = treeLayout(root);

          // Add links
          svg
            .selectAll('.link')
            .data(treeData.links())
            .join('path')
            .attr('class', 'link')
            .attr(
              'd',
              d3
                .linkHorizontal()
                .x((d) => d.y)
                .y((d) => d.x)
            );

          // Add nodes
          const nodes = svg
            .selectAll('.node')
            .data(treeData.descendants())
            .join('g')
            .attr('class', 'node')
            .attr('transform', (d) => `translate(${d.y},${d.x})`);

          // Add circles to nodes
          nodes.append('circle').attr('r', 5);

          // Add Pokemon sprites
          nodes
            .append('image')
            .attr('class', 'pokemon-sprite')
            .attr('x', -30)
            .attr('y', -30)
            .attr(
              'href',
              (d) =>
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.data.id}.png`
            );

          // Add Pokemon names
          nodes
            .append('text')
            .attr('dy', '45px')
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text((d) => d.data.name);

          // Make the div draggable
          const drag = d3.drag().on('start', dragstarted).on('drag', dragged);

          evolutionDiv.call(drag);

          // Show the evolution div with transition
          setTimeout(() => {
            evolutionDiv
              .classed('active', true)
              .style('transform', 'translate(-50%, -50%) scale(1)');
          }, 50);
        } catch (error) {
          console.error('Error fetching evolution data:', error);
        }
      }

      // recursively build the evolution tree
      function processEvolutionChain(chain) {
        const result = {
          name: formatName(chain.species.name),
          id: getIdFromUrl(chain.species.url),
          children: [],
        };

        if (chain.evolves_to && chain.evolves_to.length > 0) {
          result.children = chain.evolves_to.map((evolution) =>
            processEvolutionChain(evolution)
          );
        }

        return result;
      }

      // format the pokemon name
      function formatName(name) {
        return name
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // extract the pokemon id from the url
      function getIdFromUrl(url) {
        const matches = url.match(/\/(\d+)\//);
        return matches ? parseInt(matches[1]) : null;
      }

      // show comparison when compare button is clicked
      function showComparison(selectedPokemon, allPokemon) {
        // Remove any existing comparison div
        d3.selectAll('.compare-div').remove();

        // Create new comparison div
        const compareDiv = d3
          .select('body')
          .append('div')
          .attr('class', 'compare-div')
          .style('left', '50%')
          .style('top', '50%')
          .style('transform', 'translate(-50%, -50%)');

        // Add close button
        compareDiv
          .append('button')
          .attr('class', 'stats-close')
          .html('&times;')
          .on('click', function (event) {
            event.stopPropagation();
            const div = d3.select(this.parentNode);
            div.remove();
          });

        // Add header
        compareDiv
          .append('div')
          .attr('class', 'stats-header')
          .text('Pokémon Base Stat Comparison');

        // Create SVG for scatter plot
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = compareDiv
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

        // Add clip path to prevent points from rendering outside the plot area
        svg
          .append('defs')
          .append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', width)
          .attr('height', height);

        const g = svg
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate total stats for each Pokémon
        const data = allPokemon.map((p) => ({
          id: p.id,
          name: p.name,
          totalStats: p.hp + p.attack + p.defense + p.spAtk + p.spDef + p.speed,
        }));

        // Create scales
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.id)])
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.totalStats)])
          .range([height, 0]);

        // Create zoom behavior
        const zoom = d3
          .zoom()
          .scaleExtent([1, 10])
          .extent([
            [0, 0],
            [width, height],
          ])
          .on('zoom', zoomed);

        // Add invisible rect for zoom behavior
        svg
          .append('rect')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .style('fill', 'none')
          .style('pointer-events', 'all') // Enable pointer events for zooming
          .call(zoom);

        // Create plot area group with clip path
        const plotArea = g.append('g').attr('clip-path', 'url(#clip)');

        // Add X axis
        const xAxis = g
          .append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        xAxis
          .append('text')
          .attr('class', 'axis-label')
          .attr('x', width / 2)
          .attr('y', 40)
          .style('text-anchor', 'middle')
          .text('Pokémon Number');

        // Add Y axis
        const yAxis = g
          .append('g')
          .attr('class', 'y-axis')
          .call(d3.axisLeft(y));

        yAxis
          .append('text')
          .attr('class', 'axis-label')
          .attr('transform', 'rotate(-90)')
          .attr('y', -40)
          .attr('x', -height / 2)
          .style('text-anchor', 'middle')
          .text('Total Base Stats');

        // Add zoom instructions
        svg
          .append('text')
          .attr('class', 'zoom-instructions')
          .attr('x', width / 2 + margin.left)
          .attr('y', margin.top - 5)
          .style('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#666')
          .text('Use mouse wheel to zoom, drag to pan');

        // Create tooltip
        const tooltip = compareDiv
          .append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);

        // Add dots
        const dots = plotArea
          .selectAll('circle')
          .data(data)
          .join('circle')
          .attr(
            'class',
            (d) =>
              `scatter-point${
                d.id === selectedPokemon.id ? ' highlighted' : ''
              }`
          )
          .attr('cx', (d) => x(d.id))
          .attr('cy', (d) => y(d.totalStats))
          .attr('r', (d) => (d.id === selectedPokemon.id ? 8 : 5))
          .on('mouseover', function (event, d) {
            // Highlight the point
            d3.select(this).attr('r', 8);

            // Show tooltip
            tooltip.transition().duration(200).style('opacity', 0.9);

            tooltip
              .html(`${d.name}<br/>Total Stats: ${d.totalStats}`)
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');

            // Calculate zoom transform to focus on nearby points
            const pointX = x(d.id);
            const pointY = y(d.totalStats);
            const scale = 3; // Zoom level

            // Calculate transform to center on the point
            const transform = d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-pointX, -pointY);

            // Smoothly transition to the new zoom state
            svg.transition().duration(750).call(zoom.transform, transform);
          })
          .on('mouseout', function (event, d) {
            // Reset point size
            d3.select(this).attr('r', d.id === selectedPokemon.id ? 8 : 5);

            // Hide tooltip
            tooltip.transition().duration(500).style('opacity', 0);
          });

        // Add reset zoom button
        const resetButton = compareDiv
          .append('button')
          .attr('class', 'reset-zoom-button')
          .style('position', 'absolute')
          .style('top', '10px')
          .style('right', '40px')
          .style('padding', '5px 10px')
          .style('border-radius', '4px')
          .style('border', '1px solid #ccc')
          .style('background', '#fff')
          .style('cursor', 'pointer')
          .text('Reset Zoom')
          .on('click', function () {
            svg
              .transition()
              .duration(750)
              .call(zoom.transform, d3.zoomIdentity);
          });

        // update the transform for the plot area
        function zoomed(event) {
          // Update the transform for the plot area
          const transform = event.transform;

          // Update axes
          xAxis.call(d3.axisBottom(transform.rescaleX(x)));
          yAxis.call(d3.axisLeft(transform.rescaleY(y)));

          // Update dots
          dots
            .attr('cx', (d) => transform.applyX(x(d.id)))
            .attr('cy', (d) => transform.applyY(y(d.totalStats)));
        }

        // Make the div draggable
        const drag = d3.drag().on('start', dragstarted).on('drag', dragged);

        compareDiv.call(drag);

        // Show the comparison div with transition
        setTimeout(() => {
          compareDiv.classed('active', true);
        }, 50);
      }

      // Show modal with flex display
      modal.style.display = 'flex';
    }
  })
  .catch((error) => {
    console.error('Error loading the Pokemon data:', error);
    document.getElementById('pokemon-grid').innerHTML =
      'Error loading Pokemon data. Please make sure pokemon.csv exists and is properly formatted.';
  });
