function createUserObject({
    name,
    email,
    studentId,
    password
}) {
    return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        studentId: studentId.trim(),
        password,
        createdAt: new Date()
    };
}

module.exports = {
    createUserObject
};