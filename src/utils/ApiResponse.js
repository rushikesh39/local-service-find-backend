class ApiResponse {
  constructor(
    statusCode,
    message = "Success",
    data = null,
    success = true
  ) {
    this.success = success;
    this.statusCode=statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;