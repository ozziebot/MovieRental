const tagsEl = document.getElementById('tags')
var selectedGenre = []

const genres = 
[
	{ "id": 28,		"name": "Action" },
	{ "id": 12,		"name": "Adventure" },
	{ "id": 16,		"name": "Animation" },
	{ "id": 35,		"name": "Comedy" },
	{ "id": 80,		"name": "Crime" },
	{ "id": 99,		"name": "Documentary" },
	{ "id": 18,		"name": "Drama" },
	{ "id": 10751,	"name": "Family" },
	{ "id": 14,		"name": "Fantasy" },
	{ "id": 36,		"name": "History" },
	{ "id": 27,		"name": "Horror" },
	{ "id": 10402,	"name": "Music" },
	{ "id": 9648,	"name": "Mystery" },
	{ "id": 10749,	"name": "Romance" },
	{ "id": 878,	"name": "Science Fiction" },
	{ "id": 10770,	"name": "TV Movie" },
	{ "id": 53,		"name": "Thriller" },
	{ "id": 10752,	"name": "War" },
	{ "id": 37,		"name": "Western" }
]

function setGenre()
{
	tagsEl.innerHTML= '';
	genres.forEach(genre =>
    {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.classList.add("btn-check");
        input.id = "btn-check" + genre.id;
        input.setAttribute("autocomplete", "off");
        input.name = "category";
        input.value = genre.id;

        const label = document.createElement("label");
        label.classList.add("btn", "btn-light", "me-2", "mb-2");
        label.setAttribute("for", "btn-check" + genre.id);
        label.innerText = genre.name;
		input.addEventListener('click',() =>
        {
			if(selectedGenre.length == 0)
            {
				selectedGenre.push(genre.id);
                label.classList.add("active");
			}
            else
            {
				if(selectedGenre.includes(genre.id))
                {
					selectedGenre.forEach((id,idx) => 
                    {
						if(id==genre.id)
                        {
							selectedGenre.splice(idx,1);
						}
					})
                    label.classList.remove("active");
				}
                else
                {
					selectedGenre.push(genre.id);
                    label.classList.add("active");
				}
			}
            console.log(selectedGenre)
		})
        tagsEl.append(input);
        tagsEl.append(label);
	})
}

onload = setGenre;