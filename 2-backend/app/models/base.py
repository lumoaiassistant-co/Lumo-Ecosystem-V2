from typing import Any
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    """
    كلاس مخصص يسمح لـ Pydantic بالتعامل مع MongoDB ObjectIds.
    يدعم التحقق (Validation) من النصوص أو الـ ObjectId نفسه، 
    ويقوم بتحويله لـ string عند إرسال JSON للـ Frontend.
    """
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            # كيف يظهر في الـ JSON (كـ string)
            json_schema=core_schema.str_schema(),
            # كيف يتم التحقق منه في الـ Python
            python_schema=core_schema.union_schema([
                # إذا كان أوبجيكت جاهز
                core_schema.is_instance_schema(ObjectId),
                # إذا كان نص يتم تحويله لـ ObjectId
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            # كيف يتم تحويله لنص عند الـ Serialization
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v: str) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId format")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema: core_schema.CoreSchema, handler: Any) -> Any:
        # دي التكة اللي بتخلي Swagger UI يعرض الحقل كـ string
        json_schema = handler(_core_schema)
        json_schema.update(
            type="string", 
            example="507f1f77bcf86cd799439011",
            description="MongoDB unique identifier (ObjectId)"
        )
        return json_schema