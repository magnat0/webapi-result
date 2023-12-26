document.addEventListener('DOMContentLoaded', () =>{
    fetch('/courses', {method : "GET"})
    .then(response => response.json())
    .then(data => {
        var courses = document.getElementById('courses')
        data.forEach(element => {
            var course = document.createElement('li')
            var content = `
            <a href = "/${element.id}">
            <div class="course-title">${element.title.length > 60 ? element.title.substr(0,60) + "..." : element.title}</div>
            <div class="partner-name">${element.teachers}</div>
            <div class="course-active"><small>${element.is_active ? 'Активный' : 'Неактивный'}</small></div></a>`;
            course.innerHTML = content;
            courses.appendChild(course);
            course.id = `${element.id}`;
        });

        var courses_delete = document.getElementById('courses_delete')
        data.forEach(element => {
            var course = document.createElement('li')
            var content = `${element.title.length > 30 ? element.title.substr(0,30) + "..." : element.title}`;
            course.innerHTML = content;
            courses_delete.appendChild(course);
            course.setAttribute('data-id' , `${element.id}`);
        });
    })
}
);


//Добавление курса
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



var ws = new WebSocket(`${ws_protocol}://${server_run}/ws`);
ws.onmessage = function(event) {
    var courseData = JSON.parse(event.data);
    var courses = document.getElementById('courses')
    var course = document.createElement('li')
    var content = `
    <a href ="/${courseData.id}">
    <div class="course-title">${courseData.title.length > 60 ? courseData.title.substr(0,60) + "..." : courseData.title}</div>
    <div class="partner-name">${courseData.teachers}</div>
    <div class="course-active"><small>${courseData.is_active ? 'Активный' : 'Неактивный'}</small></div></a>`;
    course.innerHTML = content;
    courses.appendChild(course);
    course.id = `${courseData.id}`;

    var courses_delete = document.getElementById('courses_delete')
    var course_del = document.createElement('li')
    var content_del = `${courseData.title.length > 30 ? courseData.title.substr(0,30) + "..." : courseData.title}`;
    course_del.innerHTML = content_del;
    courses_delete.appendChild(course_del);
    course_del.setAttribute('data-id' , `${courseData.id}`);
};

document.getElementById('courseForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var courseData = {
        title: event.target.courseName.value,
        description: event.target.courseDescription.value,
        teachers: event.target.organizerName.value,
        is_active: event.target.isActive.checked
    };

    fetch('/courses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else if (response.status === 400) {
            return response.json().then(data => {
                throw new Error("Курс с введеным вами названием уже присутсвует на сайте");
            });
        } else {
            throw new Error('Неизвестная ошибка сервера');
        }
    })
    .then(data => {
        console.log(data);
        ws.send(JSON.stringify(data));
    })
    .catch(error => alert(error.message));
    event.target.reset(); 
});

//Удаление курса
var coursesList = document.getElementById('courses_delete');
var deleteButton = document.getElementById('deleteButton');

deleteButton.addEventListener('click', function() {
    if (coursesList.style.display === 'none') {
        coursesList.style.display = 'block';
        deleteButton.textContent = 'Скрыть курсы';
        deleteButton.className = "btn btn-outline-secondary";
    } else {
        coursesList.style.display = 'none';
        deleteButton.textContent = 'Удаление курса';
        deleteButton.className = "btn btn-outline-danger";
    }
});

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

coursesList.addEventListener('click', function(event) {
    if (event.target.tagName === 'LI') {
        var courseId = event.target.dataset.id;

        fetch('/courses/' + courseId, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error('Ошибка сервера: ' + data.detail);
                });
            } else {
                throw new Error('Неизвестная ошибка сервера');
            }
        }).then(data =>{
            ws2.send(JSON.stringify(data));
        })
        .catch(error => alert(error.message));
    }
});


//Изменение курса
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