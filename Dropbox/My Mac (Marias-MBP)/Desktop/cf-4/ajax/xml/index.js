$(document).ready(function () {
  fetchBooks();
});

function fetchBooks() {
  onBeforeSend();

  let xhr = new XMLHttpRequest();
  xhr.open("GET", "./books.xml", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        handleResults(xhr.responseXML);
      } else {
        onAPIError();
      }
    }
  };

  xhr.send();
}

function onBeforeSend() {
  hideError();
}

function handleResults(response) {
  if (!response) {
    showError();
    return;
  }

  let books = $(response).find("book");
  handleBooks(books);
}

function handleBooks(books) {
  let output = `<tr>
  <th>Title</th><th>Author</th>
  </tr>`;

  for (const book of books) {
    let title = $(book).find("title").text();
    let author = $(book).find("author").text();
    output += `<tr>
                <td>${title}</td>
                <td>${author}</td>
                </tr>`;
  }

  $(".books").html(output);
}

function onAPIError() {
  console.log("Error in API");
}

function showError() {
  $(".error.hidden").clone().removeClass("hidden").appendTo($(".outer"));
}

function hideError() {
  $(".outer").find(".error").remove();
}
