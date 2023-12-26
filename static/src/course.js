var courseId = document.body.getAttribute('data-course-id');

document.addEventListener("DOMContentLoaded", function() {
    fetch(`/courses/${courseId}`, {method : "GET"})
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error();
        }
    })
    .then(data => {
        var course_title = document.getElementById("course_title");
        var course_description = document.getElementById("course_description");
        var course_organizator = document.getElementById("organizerName");
        var course_isActive = document.getElementById("isActive");
        course_title.innerText = data.title;
        course_description.innerText = "Описание:\n" + data.description;
        course_organizator.innerText = "Организатор(ы):\n" + data.teachers;
        course_isActive.innerText = "Статус:\n" + (data.is_active ? "Преподается" : "Не преподается");
        var comments_list = document.getElementById('comments');
        data.comments.forEach(com => {
            var comment = document.createElement('li');
            var content = `<span data-span-id=${com.id} onclick="UpdateComment(event)">${com.text}</span><button data-id=${com.id} 
            id="commentDelete" onclick="DeleteComment(event)" class="btn btn-danger">Удалить</button>`;
            comment.innerHTML = content;
            comments_list.appendChild(comment);
            comment.setAttribute('data-com-id' , `${com.id}`);
        });  
    })
    .catch(error => window.location.href = '/');
});

//Добавление комментария
var ws3 = new WebSocket(`${ws_protocol}://${server_run}/ws/append_comments/${courseId}`);
ws3.onmessage = function(event) {
    var courseData = JSON.parse(event.data);
    var comments_list = document.getElementById('comments');
    var comment = document.createElement('li')
    var content = `<span data-span-id=${courseData.id} onclick="UpdateComment(event)">${courseData.text}</span><button data-id=${courseData.id}
    id="commentDelete" onclick="DeleteComment(event)" class="btn btn-danger">Удалить</button>`;
    comment.innerHTML = content;
    comments_list.appendChild(comment);
    comment.setAttribute('data-com-id' , `${courseData.id}`);
};

document.getElementById('addComment').addEventListener('submit', function(event) {
    event.preventDefault();

    var courseData = {
        text : event.target.addCommentText.value
    };

    fetch(`/course/${courseId}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error('Ошибка сервера: ' + response.status);
        }
    })
    .then(data => {
        console.log(data);
        ws3.send(JSON.stringify(data));
    })
    .catch(error => console.error('Ошибка при отправке данных:', error));
    event.target.reset(); 
});


//Удаление комментария
var ws4 = new WebSocket(`${ws_protocol}://${server_run}/ws/delete_comments/${courseId}`);
ws4.onmessage = function(event) {
    var courseData = JSON.parse(event.data);
    var courseDElElement = document.querySelector('[data-com-id="' + courseData.id + '"]');
    if (courseDElElement) {
        courseDElElement.remove();
    }
};

function DeleteComment(event){
    var comment_id = event.target.getAttribute("data-id");

    fetch(`/comments/${comment_id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error('Ошибка сервера: ' + response.status);
        }
    }).then(data =>{
        ws4.send(JSON.stringify(data));
    })
    .catch(error => console.error('Ошибка при удалении курса:', error));
}

//Изменение комментария
var ws5 = new WebSocket(`${ws_protocol}://${server_run}/ws/update_comments/${courseId}`);
ws5.onmessage = function(event) {
    var commentData = JSON.parse(event.data);
    var commentElement = document.querySelector('[data-span-id="' + commentData.id + '"]');
    if (commentElement) {
        commentElement.innerHTML = commentData.text;
    }
};

function UpdateComment(event){
    var comment = event.target;
    var comment_id = event.target.getAttribute("data-span-id");

    var form = document.createElement('form');
    var input = document.createElement('textarea');
    var submitButton = document.createElement('button');
    var closeButton = document.createElement('button');

    submitButton.textContent = 'Отправить';
    submitButton.className = "btn btn-success";
    closeButton.textContent = 'Закрыть';
    closeButton.className = "btn btn-secondary";
    submitButton.type = 'submit';
    input.value = comment.textContent;

    form.appendChild(input);
    form.appendChild(submitButton);
    form.appendChild(closeButton);

    comment.replaceWith(form);
    
    form.addEventListener("submit", (e) =>{
        e.preventDefault();

        if (input.value.trim() === '') {
            event.preventDefault();
            alert('Поле не может быть пустым');
        } 
        else{
        var commentData = {
            text : input.value
        }

        fetch(`/comments/${comment_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error('Ошибка сервера: ' + response.status);
            }
        }).then(data =>{
            var newSpan = document.createElement('span');
            newSpan.textContent = data.text;
            newSpan.setAttribute('onclick', 'UpdateComment(event)');
            newSpan.setAttribute('data-span-id',`${data.id}`);
            form.replaceWith(newSpan);
            ws5.send(JSON.stringify(data));
        })
        .catch(error => console.error('Ошибка при удалении курса:', error));
    }});

    closeButton.addEventListener('click', function(event) {
        event.preventDefault();
        form.replaceWith(comment);
    });
}

//изменение курса
document.getElementById('showFormButton').addEventListener('click', function() {
    var form = document.getElementById('courseForm');
    form.style.display = 'block';

    document.getElementById('showFormButton').style.display = 'none';
    document.getElementById('hideFormButton').style.display = 'block';
});

document.getElementById('hideFormButton').addEventListener('click', function() {
    var form = document.getElementById('courseForm');
    form.style.display = 'none';

    document.getElementById('hideFormButton').style.display = 'none';
    document.getElementById('showFormButton').style.display = 'block';
});

var ws6 = new WebSocket(`${ws_protocol}://${server_run}/ws/update_course`);
ws6.onmessage = function(event) {
    var data = JSON.parse(event.data);
    if (window.location.pathname == `/${data.id}`){
        var course_title = document.getElementById("course_title");
        var course_description = document.getElementById("course_description");
        var course_organizator = document.getElementById("organizerName");
        var course_isActive = document.getElementById("isActive");
        course_title.innerText = data.title;
        course_description.innerText = "Описание:\n" + data.description;
        course_organizator.innerText = "Организатор(ы):\n" + data.teachers;
        course_isActive.innerText = "Статус:\n" + (data.is_active ? "Преподается" : "Не преподается");
    }
    else if(window.location.pathname == `/`){
        var courseDElElement = document.querySelector('[data-id="' + data.id + '"]');
        if (courseDElElement) {
            var content = `${data.title.length > 30 ? data.title.substr(0,30) + "..." : data.title}`;
            courseDElElement.innerHTML = content;
        }
        var courseElement = document.querySelector('[id="' + data.id + '"]');
        if (courseElement) {
            var content = `
            <a href = "/${data.id}">
            <div class="course-title">${data.title.length > 60 ? data.title.substr(0,60) + "..." : data.title}</div>
            <div class="partner-name">${data.teachers}</div>
            <div class="course-active"><small>${data.is_active ? 'Активный' : 'Неактивный'}</small></div></a>`;
            courseElement.innerHTML = content;
        }
    }
};


document.getElementById('courseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var data = {};
    for (var pair of formData.entries()) {
        if (pair[1] !== '') {
            data[pair[0]] = pair[1];
        }
    }
    
        fetch(`/course/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else if (response.status === 404) {
                return response.json().then(data => {
                    throw new Error(data.detail);
                });
            } else {
                throw new Error("Нельзя поменять название курса на значение, которое уже есть в на сайте");
            }
        })
        .then(data => {
            ws6.send(JSON.stringify(data))
        })
        .catch(error => alert(error.message));
        e.target.reset(); 
});


//Удаление курса
var ws2 = new WebSocket(`${ws_protocol}://${server_run}/ws2`);
ws2.onmessage = function(event) {
    var data = JSON.parse(event.data);
    if (window.location.pathname == `/${data.id}`){
        alert("Данный курс был удален, вы будете перенаправлены на главную страницу!");
        window.location.href = '/';
    }
    else if(window.location.pathname == `/`){
    var courseData = JSON.parse(event.data);
    var courseDElElement = document.querySelector('[data-id="' + courseData.id + '"]');
    if (courseDElElement) {
        courseDElElement.remove();
    }
    var courseElement = document.querySelector('[id="' + courseData.id + '"]');
    if (courseElement) {
        courseElement.remove();
    }
    }
};