variable "REGISTRY" {
	default = "kirillasyamov"
}

target "auth-service" {
	context = "."
	dockerfile = "Dockerfile.service"
	args = { SERVICE = "auth-service" }
	tags = ["${REGISTRY}/auth-service:latest"]
}

target "user-service" {
	context = "."
	dockerfile = "Dockerfile.service"
	args = { SERVICE = "user-service" }
	tags = ["${REGISTRY}/user-service:latest"]
}

target "token-service" {
	context = "."
	dockerfile = "Dockerfile.service"
	args = { SERVICE = "token-service" }
	tags = ["${REGISTRY}/token-service:latest"]
}

target "api-gateway" {
	context = "."
	dockerfile = "Dockerfile.service"
	args = { SERVICE = "api-gateway" }
	tags = ["${REGISTRY}/api-gateway:latest"]
}

target "media-service" {
	context = "."
	dockerfile = "Dockerfile.service"
	args = { SERVICE = "media-service" }
	tags = ["${REGISTRY}/media-service:latest"]
}

group "default" {
 	targets = ["auth-service", "user-service", "token-service", "api-gateway", "media-service"]
}
