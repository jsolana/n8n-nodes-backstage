.PHONY: build lint docker run clean

build:
	npm run build

lint:
	npm run lint

docker: build
	docker build -f Dockerfile.dev -t n8n-backstage-dev .

run: docker
	docker run -it --rm \
		--name n8n-dev \
		-p 5678:5678 \
		-v n8n_backstage_dev_data:/home/node/.n8n \
		--add-host host.docker.internal:host-gateway \
		n8n-backstage-dev

clean:
	rm -rf dist node_modules
	docker rm -f n8n-dev 2>/dev/null || true
	docker rmi n8n-backstage-dev 2>/dev/null || true
	docker volume rm n8n_backstage_dev_data 2>/dev/null || true
