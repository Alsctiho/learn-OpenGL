#version 330 core
in   vec3 FragPos;
in   vec3 Normal;
in   vec2 Texture;

out vec4 FragColor;

struct DirLight {
    vec3 direction;	//sun -> fragment
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform DirLight dirLight;


struct PointLight{
	vec3 position;

	float constant;
	float linear;
	float quadratic;

	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

#define NR_POINT_LIGHTS 2
uniform PointLight pointLights[NR_POINT_LIGHTS];

struct SpotLight{
	vec3 direction;

	float innerCutOff;	//cos theta
	float outerCutOff;	//cos phi

	float constant;
	float linear;
	float quadratic;

	vec3 diffuse;
	vec3 specular;
};

uniform SpotLight spotLight;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};   

uniform Material material;

uniform vec3 viewPos;

//prototypes
vec3 CalcDirLight( DirLight dirLight, vec3 normal, vec3 viewDir);
vec3 CalcPointLight(PointLight pointLight, vec3 normal, vec3 fragPos, vec3 viewDir);
vec3 CalcSpotLight(SpotLight spotLight ,vec3 normal, vec3 fragPos, vec3 viewPos);

void main()
{
	vec3 normal = normalize(Normal);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 result = vec3(0.0f,0.0f,0.0f);
	result += CalcDirLight(dirLight, normal, viewDir);
	for(int i = 0; i < NR_POINT_LIGHTS; i++)
		result += CalcPointLight(pointLights[i], normal, FragPos, viewDir); 
	result += CalcSpotLight(spotLight, normal, FragPos, viewPos);	
	FragColor = vec4(result, 1.0f);
}

vec3 CalcDirLight( DirLight dirLight, vec3 normal, vec3 viewDir)
{
	//ambient
	vec3 ambient = dirLight.ambient * vec3(texture(material.diffuse, Texture));
	//diffuse
	vec3 lightDir = normalize(-dirLight.direction);
	float diff = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = dirLight.diffuse * diff * vec3(texture(material.diffuse, Texture));
	//specular
	vec3 reflectDir = reflect(lightDir, normal);
	float spec = pow(max(dot(reflectDir, viewDir), 0.0f), material.shininess);
	vec3 specular = dirLight.specular * spec * vec3(texture(material.specular, Texture));

	return (ambient + diffuse + specular);
}

vec3 CalcPointLight(PointLight pointLight, vec3 normal, vec3 fragPos, vec3 viewDir)
{
	//ambient
	vec3 ambient = pointLight.ambient * vec3(texture(material.diffuse, Texture));
	//diffuse
	vec3 lightDir = normalize(fragPos - pointLight.position);
	float diff = max(dot(normal, -lightDir), 0.0);
	vec3 diffuse = pointLight.diffuse * diff * vec3(texture(material.diffuse, Texture));
	//specular
	vec3 reflectDir = reflect(lightDir, normal);
	float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
	vec3 specular = pointLight.specular * spec * vec3(texture(material.specular, Texture));

	float distance = length(pointLight.position - fragPos);
	float attenuation = 1.0 / (pointLight.constant + pointLight.linear * distance 
									+ pointLight.quadratic * distance * distance);
	ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

	return ambient + diffuse + specular;
}

vec3 CalcSpotLight(SpotLight spotLight ,vec3 normal, vec3 fragPos, vec3 viewPos)
{
	//diffuse 
	vec3 lightDir = normalize(viewPos - fragPos);
	float diff = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = spotLight.diffuse * diff * vec3(texture(material.diffuse, Texture));
	//specular
	vec3 reflectDir = reflect(-lightDir, normal);
	vec3 viewDir = normalize(viewPos - FragPos);
	float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
	vec3 specular = spotLight.specular * spec * vec3(texture(material.specular, Texture));

	float distance = length(viewPos - fragPos);
	float attenuation = 1.0 / (spotLight.constant + spotLight.linear * distance 
									+ spotLight.quadratic * distance * distance);
	
	float theta = dot(lightDir, -normalize(spotLight.direction));
	float epsilon = spotLight.innerCutOff - spotLight.outerCutOff;
	float intensity = clamp((theta - spotLight.outerCutOff) / epsilon, 0.0, 1.0);

	diffuse *= attenuation * intensity;
	specular *= attenuation * intensity;

	return diffuse + specular;
}