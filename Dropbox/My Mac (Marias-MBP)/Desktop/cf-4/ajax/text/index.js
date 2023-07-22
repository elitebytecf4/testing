$(document).ready(function () {
  $(".btn").on("click", function () {
    fetchData();
  });
});

function fetchData() {
  let xhr = new XMLHttpRequest();

  xhr.open("GET", "./hello.txt", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        handleResults(xhr.responseText);
      } else {
        showError();
      }
    }
  };

  xhr.send();
}

function handleResults(response) {
  let transformed = transformResponse(response);
  showResults(transformed);
}

function transformResponse(response) {
  return _.upperCase(response);
}

function showResults(response) {
  $(".cf-text").text(response);
}

function showError() {
  console.log("API Error");
}
