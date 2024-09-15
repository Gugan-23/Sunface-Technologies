from mongoengine import Document, StringField  # Removed TextField

class ExampleModel(Document):
    name = StringField(max_length=100)
    description = StringField()  # Using StringField instead of TextField

    def __str__(self):
        return self.name
